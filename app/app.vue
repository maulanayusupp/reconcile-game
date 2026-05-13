<template>
  <div class="app-shell">
    <div class="bg-grid" aria-hidden="true" />
    <div class="bg-glow" aria-hidden="true" />
    <NuxtPage />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at 20% 0%, #1a2548 0%, #0a0e1c 60%);
  color: #e9eef7;
}
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(120,140,200,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120,140,200,0.06) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at 50% 50%, #000 0%, transparent 70%);
  pointer-events: none;
}
.bg-glow {
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 1200px;
  height: 600px;
  background: radial-gradient(circle, rgba(94,224,196,0.15), transparent 60%);
  filter: blur(80px);
  pointer-events: none;
  animation: drift 18s ease-in-out infinite alternate;
}
@keyframes drift {
  from { transform: translate(-50%, 0); }
  to   { transform: translate(-40%, 60px); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
