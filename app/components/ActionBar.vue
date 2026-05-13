<script setup lang="ts">
import type { ActionType } from '~/composables/useLevels'

defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  (e: 'action', a: ActionType): void
  (e: 'clear'): void
  (e: 'hint'): void
}>()

const actions: { id: ActionType; label: string; icon: string; tone: string }[] = [
  { id: 'reconcile',    label: 'Reconcile',     icon: '✓', tone: 'green' },
  { id: 'refund',       label: 'Refund',        icon: '↺', tone: 'pink' },
  { id: 'create_order', label: 'Create Order',  icon: '+', tone: 'blue' },
  { id: 'cancel_order', label: 'Cancel Order',  icon: '×', tone: 'orange' },
  { id: 'escalate',     label: 'Escalate',      icon: '!', tone: 'red' },
]
</script>

<template>
  <div class="action-bar">
    <div class="left">
      <div class="selected-indicator" :class="{ active: selectedCount > 0 }">
        <span class="count">{{ selectedCount }}</span>
        <span class="label">selected</span>
      </div>
      <button class="utility" @click="emit('clear')" :disabled="selectedCount === 0">
        Clear
      </button>
      <button class="utility hint" @click="emit('hint')">
        💡 Hint
      </button>
    </div>
    <div class="actions">
      <button
        v-for="a in actions"
        :key="a.id"
        class="action"
        :class="[`tone-${a.tone}`, { active: selectedCount > 0 }]"
        :disabled="selectedCount === 0"
        :data-tutorial="`action-${a.id}`"
        @click="emit('action', a.id)"
      >
        <span class="icon">{{ a.icon }}</span>
        <span class="text">{{ a.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(180deg, rgba(15,20,30,0.85), rgba(10,14,22,0.95));
  border: 1px solid rgba(120,140,200,0.18);
  border-radius: 14px;
  backdrop-filter: blur(8px);
}
.left {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
.selected-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  padding: 0.4rem 0.8rem;
  border: 1px dashed rgba(120, 140, 200, 0.25);
  border-radius: 999px;
  font-size: 0.75rem;
  color: rgba(220, 230, 245, 0.5);
  transition: all 0.25s ease;
}
.selected-indicator.active {
  border-color: #5ee0c4;
  color: #5ee0c4;
  background: rgba(94, 224, 196, 0.06);
  box-shadow: 0 0 18px rgba(94,224,196,0.2);
}
.count {
  font-weight: 700;
  font-size: 0.95rem;
}

.utility {
  background: transparent;
  border: 1px solid rgba(120,140,200,0.2);
  color: rgba(220,230,245,0.7);
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}
.utility:hover:not(:disabled) {
  border-color: rgba(120,140,200,0.5);
  color: #fff;
}
.utility:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.utility.hint { background: rgba(255, 200, 80, 0.08); border-color: rgba(255,200,80,0.3); color: #ffc850; }
.utility.hint:hover:not(:disabled) {
  background: rgba(255, 200, 80, 0.15);
  border-color: #ffc850;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.action {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(20,25,40,0.6);
  border: 1px solid rgba(120,140,200,0.2);
  color: #fff;
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  overflow: hidden;
}
.action::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--tone, transparent);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 0;
}
.action .icon, .action .text { position: relative; z-index: 1; }
.action .icon {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--tone, rgba(255,255,255,0.1));
  font-weight: 700;
}
.action:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--tone, rgba(120,140,200,0.5));
  box-shadow: 0 8px 24px var(--tone-shadow, rgba(0,0,0,0.4));
}
.action:active:not(:disabled) {
  transform: translateY(0);
}
.action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.action.active { animation: glow 1.6s infinite; }

.tone-green   { --tone: rgba(120, 220, 160, 0.5); --tone-shadow: rgba(120, 220, 160, 0.25); }
.tone-pink    { --tone: rgba(255, 140, 220, 0.5); --tone-shadow: rgba(255, 140, 220, 0.25); }
.tone-blue    { --tone: rgba(108, 201, 247, 0.5); --tone-shadow: rgba(108, 201, 247, 0.25); }
.tone-orange  { --tone: rgba(255, 175, 90, 0.5);  --tone-shadow: rgba(255, 175, 90, 0.25); }
.tone-red     { --tone: rgba(255, 90, 122, 0.5);  --tone-shadow: rgba(255, 90, 122, 0.25); }

@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 0 var(--tone-shadow, rgba(255,255,255,0.2)); }
  50%      { box-shadow: 0 0 0 6px transparent; }
}
</style>
