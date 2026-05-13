<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useTutorial } from '~/composables/useTutorial'

const tutorial = useTutorial()
const targetRect = ref<DOMRect | null>(null)
const PAD = 10

const active = computed(() => tutorial.state.active)
const step = computed(() => tutorial.currentStep.value)
const stepNumber = computed(() => tutorial.state.stepIdx + 1)
const total = computed(() => tutorial.total.value)
const isLast = computed(() => tutorial.state.stepIdx === tutorial.total.value - 1)

let rafId: number | null = null

function refreshTarget() {
  if (!active.value) {
    targetRect.value = null
    return
  }
  const s = step.value
  if (!s?.target) {
    targetRect.value = null
    return
  }
  const el = document.querySelector(`[data-tutorial="${s.target}"]`) as HTMLElement | null
  if (!el) {
    targetRect.value = null
    return
  }
  // Scroll target into view if not visible
  const r = el.getBoundingClientRect()
  if (r.top < 0 || r.bottom > window.innerHeight) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
  targetRect.value = el.getBoundingClientRect()
}

function loop() {
  refreshTarget()
  rafId = requestAnimationFrame(loop)
}

onMounted(() => {
  loop()
  window.addEventListener('resize', refreshTarget)
})
onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', refreshTarget)
})

watch(active, async (v) => {
  if (v) {
    await nextTick()
    refreshTarget()
  } else {
    targetRect.value = null
  }
})

watch(() => tutorial.state.stepIdx, async () => {
  await nextTick()
  refreshTarget()
})

const holeStyle = computed(() => {
  if (!targetRect.value) return null
  const r = targetRect.value
  return {
    top: `${r.top - PAD}px`,
    left: `${r.left - PAD}px`,
    width: `${r.width + PAD * 2}px`,
    height: `${r.height + PAD * 2}px`,
  }
})

// Effective side after auto-flip when there's not enough room
const effectiveSide = ref<'top' | 'bottom' | 'left' | 'right' | 'center'>('center')

const tooltipStyle = computed(() => {
  const wantPos = step.value?.position ?? 'center'
  if (!targetRect.value || wantPos === 'center') {
    effectiveSide.value = 'center'
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }
  const r = targetRect.value
  const gap = 18
  const tipW = 340
  const tipH = 240 // generous estimate
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  // Try requested side first; if not enough room, flip to the opposite side.
  const fits = (side: typeof wantPos) => {
    if (side === 'top')    return r.top - gap - tipH > 16
    if (side === 'bottom') return r.bottom + gap + tipH < vh - 16
    if (side === 'left')   return r.left - gap - tipW > 16
    if (side === 'right')  return r.right + gap + tipW < vw - 16
    return true
  }
  const opposite: Record<string, any> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
  let side = wantPos
  if (!fits(side)) side = opposite[side] ?? side
  effectiveSide.value = side as any

  let top = 0
  let left = 0
  let transform = 'none'
  const halfW = tipW / 2
  const halfH = tipH / 2
  if (side === 'top') {
    top = r.top - gap
    left = Math.max(16 + halfW, Math.min(vw - 16 - halfW, r.left + r.width / 2))
    transform = 'translate(-50%, -100%)'
  } else if (side === 'bottom') {
    top = r.bottom + gap
    left = Math.max(16 + halfW, Math.min(vw - 16 - halfW, r.left + r.width / 2))
    transform = 'translate(-50%, 0)'
  } else if (side === 'left') {
    top = Math.max(16 + halfH, Math.min(vh - 16 - halfH, r.top + r.height / 2))
    left = r.left - gap
    transform = 'translate(-100%, -50%)'
  } else if (side === 'right') {
    top = Math.max(16 + halfH, Math.min(vh - 16 - halfH, r.top + r.height / 2))
    left = r.right + gap
    transform = 'translate(0, -50%)'
  }
  return { top: `${top}px`, left: `${left}px`, transform }
})

const arrowSide = computed(() => effectiveSide.value)

function next() {
  tutorial.next()
}

const emit = defineEmits<{ (e: 'finish'): void }>()

watch(active, (v, oldV) => {
  if (!v && oldV) emit('finish')
})

function skip() {
  tutorial.stop()
}
</script>

<template>
  <Transition name="tut">
    <div v-if="active" class="tut-root">
      <!-- 4-piece backdrop creating a "hole" around the target -->
      <template v-if="holeStyle">
        <div class="backdrop" :style="{ top: 0, left: 0, right: 0, height: holeStyle.top }" />
        <div class="backdrop" :style="{ top: `calc(${holeStyle.top} + ${holeStyle.height})`, left: 0, right: 0, bottom: 0 }" />
        <div class="backdrop" :style="{ top: holeStyle.top, left: 0, width: holeStyle.left, height: holeStyle.height }" />
        <div class="backdrop" :style="{ top: holeStyle.top, left: `calc(${holeStyle.left} + ${holeStyle.width})`, right: 0, height: holeStyle.height }" />

        <!-- pulsing highlight ring around target -->
        <div class="ring" :style="holeStyle" />
      </template>

      <!-- Full backdrop when no target -->
      <div v-else class="full-backdrop" />

      <!-- Tooltip -->
      <div
        class="tooltip"
        :class="[`pos-${arrowSide}`, { centered: !holeStyle }]"
        :style="tooltipStyle"
      >
        <div class="head">
          <span class="step-chip">step {{ stepNumber }} / {{ total }}</span>
          <button class="skip-btn" @click="skip" title="Skip tutorial">×</button>
        </div>
        <h3>{{ step?.title }}</h3>
        <p>{{ step?.message }}</p>
        <div class="actions">
          <button
            v-if="step?.advance === 'next'"
            class="btn primary"
            @click="next"
          >
            {{ isLast ? 'Got it!' : 'Next →' }}
          </button>
          <div v-else class="waiting">
            <span class="dots"><span /><span /><span /></span>
            waiting for your click…
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tut-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}
.backdrop, .full-backdrop {
  position: absolute;
  background: rgba(5, 8, 18, 0.78);
  backdrop-filter: blur(2px);
  transition: top 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), left 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), width 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), height 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), right 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), bottom 0.35s cubic-bezier(0.4, 1.4, 0.5, 1);
  pointer-events: auto;
}
.full-backdrop {
  inset: 0;
}

.ring {
  position: absolute;
  border-radius: 14px;
  border: 2px solid #5ee0c4;
  box-shadow:
    0 0 0 4px rgba(94, 224, 196, 0.18),
    0 0 30px rgba(94, 224, 196, 0.6),
    inset 0 0 20px rgba(94, 224, 196, 0.2);
  pointer-events: none;
  transition: top 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), left 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), width 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), height 0.35s cubic-bezier(0.4, 1.4, 0.5, 1);
  animation: ringPulse 1.6s ease-in-out infinite;
}
@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(94,224,196,0.18), 0 0 30px rgba(94,224,196,0.6), inset 0 0 20px rgba(94,224,196,0.2); }
  50%      { box-shadow: 0 0 0 12px rgba(94,224,196,0.05), 0 0 60px rgba(94,224,196,0.85), inset 0 0 30px rgba(94,224,196,0.35); }
}

.tooltip {
  position: fixed;
  width: 340px;
  background: linear-gradient(180deg, #1a2240, #0f1530);
  border: 1px solid rgba(94, 224, 196, 0.35);
  border-radius: 14px;
  padding: 1rem 1.1rem 1.1rem;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 24px rgba(94, 224, 196, 0.2);
  pointer-events: auto;
  transition: top 0.35s cubic-bezier(0.4, 1.4, 0.5, 1), left 0.35s cubic-bezier(0.4, 1.4, 0.5, 1);
  z-index: 101;
}
.tooltip.centered {
  width: 420px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.step-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #5ee0c4;
  background: rgba(94, 224, 196, 0.1);
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(94, 224, 196, 0.25);
}
.skip-btn {
  background: transparent;
  border: none;
  color: rgba(220, 230, 245, 0.4);
  font-size: 1.2rem;
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 6px;
  display: grid;
  place-items: center;
  line-height: 1;
}
.skip-btn:hover {
  color: #fff;
  background: rgba(255,255,255,0.06);
}

.tooltip h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
  margin: 0 0 0.4rem;
  color: #fff;
}
.tooltip p {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(220, 230, 245, 0.75);
  margin: 0 0 0.9rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
}
.btn {
  border: 1px solid rgba(120, 140, 200, 0.3);
  color: #fff;
  background: transparent;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:hover { border-color: rgba(120, 140, 200, 0.6); }
.btn.primary {
  background: linear-gradient(135deg, #5ee0c4, #6cc9f7);
  color: #0a1018;
  border: none;
  box-shadow: 0 6px 20px rgba(94, 224, 196, 0.3);
}
.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(94, 224, 196, 0.5);
}

.waiting {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: rgba(94, 224, 196, 0.85);
  margin-left: auto;
}
.dots {
  display: inline-flex;
  gap: 3px;
}
.dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #5ee0c4;
  animation: dotPulse 1.2s infinite ease-in-out;
}
.dots span:nth-child(2) { animation-delay: 0.15s; }
.dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.7); }
  50%      { opacity: 1; transform: scale(1); }
}

/* tooltip arrow */
.tooltip::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  background: #1a2240;
  border: 1px solid rgba(94, 224, 196, 0.35);
  transform: rotate(45deg);
}
.tooltip.pos-right::before {
  left: -8px;
  top: 50%;
  margin-top: -7px;
  border-top: none;
  border-right: none;
}
.tooltip.pos-left::before {
  right: -8px;
  top: 50%;
  margin-top: -7px;
  border-bottom: none;
  border-left: none;
}
.tooltip.pos-top::before {
  bottom: -8px;
  left: 50%;
  margin-left: -7px;
  border-top: none;
  border-left: none;
}
.tooltip.pos-bottom::before {
  top: -8px;
  left: 50%;
  margin-left: -7px;
  border-bottom: none;
  border-right: none;
}
.tooltip.centered::before, .tooltip.pos-center::before {
  display: none;
}

/* enter/leave */
.tut-enter-active, .tut-leave-active { transition: opacity 0.3s; }
.tut-enter-from, .tut-leave-to { opacity: 0; }
</style>
