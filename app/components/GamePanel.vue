<script setup lang="ts">
import type { Source, TxRecord } from '~/composables/useLevels'

const props = defineProps<{
  title: string
  subtitle: string
  source: Source
  records: TxRecord[]
  recordStates: Record<string, 'idle' | 'selected' | 'matched' | 'wrong'>
  accent: string
}>()

const emit = defineEmits<{ (e: 'pick', id: string): void }>()
</script>

<template>
  <section class="panel" :style="{ '--accent': accent }" :data-tutorial="`panel-${source}`">
    <header class="panel-head">
      <div class="left">
        <span class="dot" />
        <div class="titles">
          <h3>{{ title }}</h3>
          <p>{{ subtitle }}</p>
        </div>
      </div>
      <div class="count">{{ records.length }}</div>
    </header>
    <div class="cards">
      <TransitionGroup name="card">
        <TransactionCard
          v-for="r in records"
          :key="r.id"
          :record="r"
          :state="recordStates[r.id] || 'idle'"
          @pick="(id) => emit('pick', id)"
        />
      </TransitionGroup>
      <div v-if="records.length === 0" class="empty">
        <span>no records</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(20,25,38,0.6), rgba(15,20,30,0.4));
  border: 1px solid rgba(120, 140, 200, 0.15);
  border-radius: 16px;
  padding: 1rem;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0.7;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.8rem;
  margin-bottom: 0.8rem;
  border-bottom: 1px dashed rgba(120, 140, 200, 0.2);
}
.left {
  display: flex;
  gap: 0.7rem;
  align-items: center;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  animation: pulse 2.4s infinite;
}
.titles h3 {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.03em;
  color: #fff;
}
.titles p {
  margin: 0;
  font-size: 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(220, 230, 245, 0.5);
  letter-spacing: 0.05em;
}
.count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--accent);
  background: rgba(255,255,255,0.04);
  padding: 4px 10px;
  border-radius: 999px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  padding-right: 0.3rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(120,140,200,0.3) transparent;
}
.cards::-webkit-scrollbar { width: 6px; }
.cards::-webkit-scrollbar-thumb { background: rgba(120,140,200,0.3); border-radius: 3px; }

.empty {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: rgba(220, 230, 245, 0.3);
  padding: 2rem 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}

.card-enter-active,
.card-leave-active { transition: all 0.45s cubic-bezier(0.5, 1.5, 0.5, 1); }
.card-enter-from   { opacity: 0; transform: translateY(10px) scale(0.95); }
.card-leave-to     { opacity: 0; transform: translateX(40px) scale(0.95); }
.card-move         { transition: transform 0.35s ease; }
</style>
