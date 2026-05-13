<script setup lang="ts">
import { computed } from 'vue'
import type { TxRecord } from '~/composables/useLevels'

const props = defineProps<{
  record: TxRecord
  state: 'idle' | 'selected' | 'matched' | 'wrong'
}>()

const emit = defineEmits<{ (e: 'pick', id: string): void }>()

const statusClass = computed(() => {
  switch (props.record.status) {
    case 'captured': return 'status-captured'
    case 'pending':  return 'status-pending'
    case 'refunded': return 'status-refunded'
    case 'failed':   return 'status-failed'
    case 'settled':  return 'status-settled'
    default: return ''
  }
})

const fmtAmount = computed(() => {
  const v = props.record.amount
  const sign = v < 0 ? '-' : ''
  return `${sign}${props.record.currency} ${Math.abs(v).toFixed(2)}`
})

function onClick() {
  if (props.state === 'matched') return
  emit('pick', props.record.id)
}
</script>

<template>
  <button
    type="button"
    class="tx-card"
    :class="[`state-${state}`, { negative: record.amount < 0, flagged: record.flagged }]"
    :disabled="state === 'matched'"
    :data-tutorial="`card-${record.id}`"
    @click="onClick"
  >
    <div class="row top">
      <span class="id">{{ record.id.slice(0, 10) }}</span>
      <span class="status" :class="statusClass">{{ record.status }}</span>
    </div>
    <div class="amount">{{ fmtAmount }}</div>
    <div class="row bottom">
      <span class="merchant">{{ record.merchant }}</span>
      <span class="time">{{ record.timestamp }}</span>
    </div>
    <span v-if="state === 'selected'" class="selected-ring" />
    <span v-if="state === 'matched'" class="check">✓</span>
    <span v-if="state === 'wrong'" class="x-mark">×</span>
  </button>
</template>

<style scoped>
.tx-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  padding: 0.7rem 0.8rem;
  background: rgba(20, 25, 38, 0.7);
  border: 1px solid rgba(120, 140, 200, 0.18);
  border-radius: 10px;
  text-align: left;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  color: #e9eef7;
  overflow: hidden;
  backdrop-filter: blur(6px);
}
.tx-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.tx-card:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.01);
  border-color: rgba(120, 140, 200, 0.45);
  box-shadow: 0 8px 28px rgba(0,0,0,0.45);
}
.tx-card:hover:not(:disabled)::before {
  opacity: 1;
}

.state-selected {
  border-color: #5ee0c4;
  background: rgba(94, 224, 196, 0.08);
  box-shadow: 0 0 0 1px #5ee0c4, 0 0 24px rgba(94, 224, 196, 0.35);
}
.state-matched {
  border-color: rgba(120, 220, 160, 0.5);
  background: rgba(40, 80, 60, 0.4);
  opacity: 0.55;
  cursor: not-allowed;
  transform: scale(0.98);
}
.state-wrong {
  animation: shake 0.4s;
  border-color: #ff5a7a;
  background: rgba(255, 90, 122, 0.12);
  box-shadow: 0 0 0 1px #ff5a7a, 0 0 24px rgba(255, 90, 122, 0.35);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.68rem;
  color: rgba(220, 230, 245, 0.6);
}
.row.top .id {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.amount {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: #fff;
  letter-spacing: 0.02em;
}
.negative .amount {
  color: #ff7a8c;
}

.status {
  text-transform: uppercase;
  font-size: 0.55rem;
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.status-captured { background: rgba(80, 180, 240, 0.18); color: #6cc9f7; }
.status-pending  { background: rgba(255, 200, 80, 0.18); color: #ffc850; }
.status-refunded { background: rgba(255, 140, 220, 0.18); color: #ff8cdc; }
.status-failed   { background: rgba(255, 90, 122, 0.18); color: #ff7a8c; }
.status-settled  { background: rgba(120, 220, 160, 0.18); color: #78dca0; }

.merchant {
  font-size: 0.7rem;
  color: rgba(220, 230, 245, 0.75);
}
.time {
  font-size: 0.65rem;
  color: rgba(220, 230, 245, 0.4);
}

.flagged::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff5a7a;
  box-shadow: 0 0 8px #ff5a7a;
  animation: pulseDot 1.2s infinite;
}

.selected-ring {
  position: absolute;
  inset: -3px;
  border-radius: 12px;
  border: 1px solid #5ee0c4;
  pointer-events: none;
  animation: ring 1.4s infinite;
}
@keyframes ring {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.06); }
}

.check, .x-mark {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.95rem;
  animation: popIn 0.35s cubic-bezier(0.5, 1.5, 0.5, 1);
}
.check { background: #78dca0; color: #0f1418; }
.x-mark { background: #ff5a7a; color: #fff; }

@keyframes popIn {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-5px); }
  75%      { transform: translateX(5px); }
}
@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
</style>
