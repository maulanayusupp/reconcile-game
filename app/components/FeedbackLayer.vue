<script setup lang="ts">
import type { Feedback } from '~/composables/useGame'

defineProps<{ items: Feedback[] }>()
</script>

<template>
  <div class="fb-wrap">
    <TransitionGroup name="fb">
      <div
        v-for="f in items"
        :key="f.id"
        :class="['fb', `fb-${f.type}`]"
      >
        {{ f.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.fb-wrap {
  position: fixed;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  pointer-events: none;
  z-index: 50;
}
.fb {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  padding: 0.6rem 1.4rem;
  border-radius: 12px;
  letter-spacing: 0.02em;
  text-shadow: 0 4px 30px rgba(0,0,0,0.6);
}
.fb-correct {
  color: #78dca0;
  text-shadow: 0 0 20px rgba(120,220,160,0.7), 0 4px 30px rgba(0,0,0,0.6);
}
.fb-wrong {
  color: #ff7a8c;
  font-size: 1.2rem;
  text-shadow: 0 0 20px rgba(255,122,140,0.7), 0 4px 30px rgba(0,0,0,0.6);
}
.fb-info {
  color: #6cc9f7;
}

.fb-enter-active { transition: all 0.3s cubic-bezier(0.4, 1.6, 0.5, 1); }
.fb-leave-active { transition: all 0.6s ease; }
.fb-enter-from { opacity: 0; transform: scale(0.3) translateY(30px); }
.fb-leave-to { opacity: 0; transform: translateY(-60px) scale(1.1); }
.fb-move { transition: transform 0.3s ease; }
</style>
