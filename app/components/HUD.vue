<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  level: number
  levelTitle: string
  score: number
  combo: number
  timeLeft: number
  totalGroups: number
  resolved: number
  complaints: number
  maxComplaints: number
}>()

const timeClass = computed(() => {
  if (props.timeLeft <= 10) return 'critical'
  if (props.timeLeft <= 20) return 'warning'
  return ''
})

const mm = computed(() => Math.floor(props.timeLeft / 60).toString().padStart(2, '0'))
const ss = computed(() => (props.timeLeft % 60).toString().padStart(2, '0'))
const progress = computed(() => (props.totalGroups > 0 ? (props.resolved / props.totalGroups) * 100 : 0))
</script>

<template>
  <header class="hud">
    <div class="left">
      <div class="level-info">
        <div class="lvl-badge">LV {{ String(level).padStart(2, '0') }}</div>
        <div class="title-wrap">
          <h2>{{ levelTitle }}</h2>
          <div class="progress">
            <div class="bar" :style="{ width: progress + '%' }" />
            <span class="progress-label">{{ resolved }} / {{ totalGroups }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="middle">
      <div class="stat score">
        <span class="num">{{ score.toLocaleString() }}</span>
        <span class="lbl">score</span>
      </div>
      <div class="stat combo" :class="{ hot: combo >= 3 }">
        <span class="num">×{{ combo }}</span>
        <span class="lbl">combo</span>
      </div>
    </div>

    <div class="right">
      <div class="complaints">
        <span
          v-for="i in maxComplaints"
          :key="i"
          class="heart"
          :class="{ lost: i <= complaints }"
        >♥</span>
      </div>
      <div class="timer" :class="timeClass">
        <span class="time-text">{{ mm }}:{{ ss }}</span>
        <span class="time-label">remaining</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hud {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: center;
  padding: 1rem 1.4rem;
  background: linear-gradient(180deg, rgba(15,20,30,0.85), rgba(10,14,22,0.7));
  border: 1px solid rgba(120,140,200,0.18);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.level-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.lvl-badge {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.45rem 0.7rem;
  background: linear-gradient(135deg, #5ee0c4, #6cc9f7);
  color: #0a1018;
  border-radius: 8px;
  letter-spacing: 0.05em;
}
.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.title-wrap h2 {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  color: #fff;
}
.progress {
  position: relative;
  width: 220px;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
}
.bar {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #5ee0c4, #6cc9f7);
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.5, 1.4, 0.5, 1);
  box-shadow: 0 0 10px rgba(94,224,196,0.6);
}
.progress-label {
  position: absolute;
  right: 0;
  top: -16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: rgba(255,255,255,0.5);
}

.middle {
  display: flex;
  gap: 1.4rem;
  align-items: center;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}
.stat .num {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.6rem;
  line-height: 1;
  color: #fff;
}
.stat .lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(220,230,245,0.4);
  margin-top: 4px;
}
.combo .num { color: #ffc850; }
.combo.hot .num {
  color: #ff7a8c;
  animation: heat 0.6s ease infinite alternate;
  text-shadow: 0 0 20px rgba(255,122,140,0.7);
}
@keyframes heat {
  from { transform: scale(1); }
  to   { transform: scale(1.08); }
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}
.complaints {
  display: flex;
  gap: 4px;
}
.heart {
  color: #ff5a7a;
  font-size: 1rem;
  text-shadow: 0 0 8px rgba(255,90,122,0.5);
  transition: opacity 0.3s, transform 0.3s;
}
.heart.lost {
  color: rgba(255,255,255,0.1);
  text-shadow: none;
  transform: scale(0.7);
}

.timer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.timer .time-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 1.5rem;
  color: #fff;
  letter-spacing: 0.04em;
}
.timer .time-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: rgba(220,230,245,0.4);
  text-transform: uppercase;
}
.timer.warning .time-text { color: #ffc850; }
.timer.critical .time-text {
  color: #ff5a7a;
  animation: tickFlash 1s infinite;
}
@keyframes tickFlash {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
</style>
