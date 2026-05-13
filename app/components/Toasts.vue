<script setup lang="ts">
import type { ToastMsg } from '~/composables/useGame'

defineProps<{ items: ToastMsg[] }>()
</script>

<template>
  <div class="toast-wrap">
    <TransitionGroup name="t">
      <div
        v-for="t in items"
        :key="t.id"
        :class="['toast', `t-${t.variant}`]"
      >
        <span class="icon">
          {{ t.variant === 'success' ? '✓' : t.variant === 'error' ? '!' : 'i' }}
        </span>
        <span class="msg">{{ t.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-wrap {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 60;
  max-width: 320px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 1rem;
  background: rgba(20,25,38,0.92);
  border: 1px solid rgba(120,140,200,0.25);
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: #e9eef7;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  flex-shrink: 0;
}
.t-success { border-color: rgba(120, 220, 160, 0.4); }
.t-success .icon { background: rgba(120,220,160,0.18); color: #78dca0; }
.t-error { border-color: rgba(255, 90, 122, 0.4); }
.t-error .icon { background: rgba(255,90,122,0.2); color: #ff7a8c; }
.t-info { border-color: rgba(108, 201, 247, 0.3); }
.t-info .icon { background: rgba(108,201,247,0.18); color: #6cc9f7; }

.t-enter-active, .t-leave-active { transition: all 0.35s cubic-bezier(0.4, 1.4, 0.5, 1); }
.t-enter-from { opacity: 0; transform: translateX(40px); }
.t-leave-to   { opacity: 0; transform: translateX(40px); }
.t-move       { transition: transform 0.3s ease; }
</style>
