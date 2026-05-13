<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGame } from '~/composables/useGame'
import { useSound } from '~/composables/useSound'

const game = useGame()
const sound = useSound()
const muted = ref(false)

onMounted(() => {
  game.loadHighScore()
})

function go() {
  game.startGame()
}

function startTutorial() {
  game.startTutorial()
}

function toggleMute() {
  muted.value = !muted.value
  sound.setMuted(muted.value)
}
</script>

<template>
  <div class="game-root">
    <Transition name="screen" mode="out-in">
      <!-- MENU -->
      <section v-if="game.state.state === 'menu'" key="menu" class="screen menu">
        <div class="brand">
          <div class="logo">
            <span class="logo-dot" />
            <span class="logo-dot d2" />
            <span class="logo-dot d3" />
          </div>
          <h1 class="title">RECONCILE</h1>
          <p class="tag">Payment ops puzzle · match the books before customers riot</p>
        </div>

        <div class="menu-card">
          <div class="menu-stats">
            <div class="stat">
              <span class="num">{{ game.state.highScore.toLocaleString() }}</span>
              <span class="lbl">best</span>
            </div>
            <div class="div" />
            <div class="stat">
              <span class="num">5</span>
              <span class="lbl">levels</span>
            </div>
          </div>

          <button class="play-btn" @click="go">
            <span class="play-text">START</span>
            <span class="play-arrow">→</span>
          </button>

          <div class="footer-row">
            <button class="mute-btn" @click="toggleMute">
              {{ muted ? '🔇' : '🔊' }}
              <span>{{ muted ? 'muted' : 'sound on' }}</span>
            </button>
            <span class="version">v0.1 · MVP</span>
          </div>
        </div>

        <div class="hint-row">
          <span class="key">tip</span>
          select records across all 3 panels covering one transaction, then pick the right action
        </div>
      </section>

      <!-- BRIEFING -->
      <section v-else-if="game.state.state === 'briefing'" key="brief" class="screen brief">
        <div class="brief-card">
          <div class="brief-head">
            <span class="lvl">LEVEL {{ game.state.levelNum }}</span>
            <span class="time-info">⏱ {{ game.state.level?.timeLimit }}s</span>
          </div>
          <h2>{{ game.state.level?.title }}</h2>
          <p>{{ game.state.level?.brief }}</p>
          <div class="brief-stats">
            <div class="bs">
              <span class="bs-num">{{ game.state.level?.groups.length }}</span>
              <span class="bs-lbl">transactions</span>
            </div>
            <div class="bs">
              <span class="bs-num">{{ game.state.level?.maxComplaints }}</span>
              <span class="bs-lbl">lives</span>
            </div>
            <div class="bs">
              <span class="bs-num">{{ game.state.totalScore.toLocaleString() }}</span>
              <span class="bs-lbl">current score</span>
            </div>
          </div>
          <button class="big-btn primary" @click="game.beginRound">
            GO →
          </button>
        </div>
      </section>

      <!-- PLAYING -->
      <section v-else-if="game.state.state === 'playing'" key="play" class="screen play">
        <HUD
          :level="game.state.levelNum"
          :level-title="game.state.level?.title ?? ''"
          :score="game.state.totalScore"
          :combo="game.state.combo"
          :time-left="game.state.timeLeft"
          :total-groups="game.state.level?.groups.length ?? 0"
          :resolved="game.state.resolved"
          :complaints="game.state.complaints"
          :max-complaints="game.state.level?.maxComplaints ?? 3"
        />
        <div class="boards">
          <GamePanel
            title="Payment Gateway"
            subtitle="// what the user paid"
            source="gateway"
            :records="game.recordsForSource('gateway')"
            :record-states="game.state.recordStates"
            accent="#6cc9f7"
            @pick="game.toggleSelect"
          />
          <GamePanel
            title="Internal DB"
            subtitle="// what the app recorded"
            source="db"
            :records="game.recordsForSource('db')"
            :record-states="game.state.recordStates"
            accent="#5ee0c4"
            @pick="game.toggleSelect"
          />
          <GamePanel
            title="Bank Settlement"
            subtitle="// money actually in"
            source="bank"
            :records="game.recordsForSource('bank')"
            :record-states="game.state.recordStates"
            accent="#ffc850"
            @pick="game.toggleSelect"
          />
        </div>
        <ActionBar
          :selected-count="game.state.selected.length"
          @action="game.submitAction"
          @clear="game.clearSelection"
          @hint="game.useHint"
        />
      </section>

      <!-- ROUND END -->
      <section v-else-if="game.state.state === 'roundEnd'" key="round-end" class="screen end">
        <div class="end-card win">
          <div class="end-icon">✓</div>
          <h2>LEVEL CLEAR</h2>
          <p class="end-sub">{{ game.state.level?.title }}</p>
          <div class="end-stats">
            <div class="es">
              <span class="es-num">+{{ game.state.roundScore.toLocaleString() }}</span>
              <span class="es-lbl">round score</span>
            </div>
            <div class="es">
              <span class="es-num">×{{ game.state.bestCombo }}</span>
              <span class="es-lbl">best combo</span>
            </div>
            <div class="es">
              <span class="es-num">{{ game.state.timeLeft }}s</span>
              <span class="es-lbl">remaining</span>
            </div>
          </div>
          <div class="end-total">
            total: <strong>{{ game.state.totalScore.toLocaleString() }}</strong>
          </div>
          <div class="end-actions">
            <button class="big-btn" @click="game.backToMenu">menu</button>
            <button class="big-btn primary" @click="game.nextLevel">next →</button>
          </div>
        </div>
      </section>

      <!-- VICTORY -->
      <section v-else-if="game.state.state === 'victory'" key="victory" class="screen end">
        <div class="end-card victory">
          <div class="confetti" aria-hidden="true">
            <span v-for="n in 30" :key="n" :style="`--i:${n}`" />
          </div>
          <div class="end-icon big">🏆</div>
          <h2>RECONCILED</h2>
          <p class="end-sub">You finished all 5 levels. The books are clean.</p>
          <div class="end-total">
            final: <strong>{{ game.state.totalScore.toLocaleString() }}</strong>
          </div>
          <div class="end-actions">
            <button class="big-btn primary" @click="game.backToMenu">main menu</button>
          </div>
        </div>
      </section>

      <!-- GAME OVER -->
      <section v-else-if="game.state.state === 'gameOver'" key="over" class="screen end">
        <div class="end-card lose">
          <div class="end-icon big">💀</div>
          <h2>GAME OVER</h2>
          <p class="end-sub">Merchants left. CEO is angry.</p>
          <div class="end-stats">
            <div class="es">
              <span class="es-num">{{ game.state.totalScore.toLocaleString() }}</span>
              <span class="es-lbl">final score</span>
            </div>
            <div class="es">
              <span class="es-num">LV {{ game.state.levelNum }}</span>
              <span class="es-lbl">reached</span>
            </div>
            <div class="es">
              <span class="es-num">×{{ game.state.bestCombo }}</span>
              <span class="es-lbl">best combo</span>
            </div>
          </div>
          <div class="end-actions">
            <button class="big-btn" @click="game.backToMenu">menu</button>
            <button class="big-btn primary" @click="game.startGame">retry</button>
          </div>
        </div>
      </section>
    </Transition>

    <FeedbackLayer :items="game.state.feedback" />
    <Toasts :items="game.state.toasts" />
  </div>
</template>

<style scoped>
.game-root {
  min-height: 100vh;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  position: relative;
}

.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* === MENU === */
.menu {
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding-top: 8vh;
}
.brand { text-align: center; }
.logo {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 1rem;
}
.logo-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #6cc9f7;
  box-shadow: 0 0 24px #6cc9f7;
  animation: bounce 1.4s infinite;
}
.logo-dot.d2 { background: #5ee0c4; box-shadow: 0 0 24px #5ee0c4; animation-delay: 0.15s; }
.logo-dot.d3 { background: #ffc850; box-shadow: 0 0 24px #ffc850; animation-delay: 0.3s; }
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
.title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: clamp(3rem, 9vw, 5.5rem);
  letter-spacing: 0.18em;
  margin: 0;
  background: linear-gradient(180deg, #fff, #9eb5d8 80%, transparent);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 30px rgba(108, 201, 247, 0.25));
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: rgba(220,230,245,0.55);
  margin-top: 0.4rem;
  letter-spacing: 0.04em;
}

.menu-card {
  width: min(420px, 90vw);
  background: rgba(15,20,30,0.7);
  border: 1px solid rgba(120,140,200,0.2);
  border-radius: 18px;
  padding: 1.5rem;
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.menu-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}
.menu-stats .stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.menu-stats .num {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  color: #fff;
}
.menu-stats .lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(220,230,245,0.45);
  margin-top: 4px;
}
.div {
  width: 1px;
  height: 30px;
  background: rgba(120,140,200,0.2);
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0.95rem 1.4rem;
  background: linear-gradient(135deg, #5ee0c4, #6cc9f7);
  border: none;
  border-radius: 12px;
  color: #0a1018;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s;
  box-shadow: 0 12px 30px rgba(94, 224, 196, 0.3);
}
.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(94, 224, 196, 0.5);
}
.play-arrow { transition: transform 0.18s; }
.play-btn:hover .play-arrow { transform: translateX(4px); }

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed rgba(120,140,200,0.18);
  padding-top: 0.8rem;
}
.mute-btn {
  background: transparent;
  border: none;
  color: rgba(220,230,245,0.5);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.mute-btn:hover { color: #fff; }
.version {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: rgba(220,230,245,0.3);
  letter-spacing: 0.1em;
}

.hint-row {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: rgba(220,230,245,0.4);
  max-width: 460px;
  text-align: center;
  line-height: 1.6;
}
.hint-row .key {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(120,140,200,0.2);
  padding: 1px 7px;
  border-radius: 4px;
  margin-right: 6px;
  color: rgba(220,230,245,0.6);
  letter-spacing: 0.06em;
}

/* === BRIEFING === */
.brief {
  align-items: center;
  justify-content: center;
}
.brief-card {
  width: min(560px, 92vw);
  background: rgba(15,20,30,0.85);
  border: 1px solid rgba(120,140,200,0.22);
  border-radius: 18px;
  padding: 2rem;
  backdrop-filter: blur(16px);
  text-align: center;
  animation: slideUp 0.5s cubic-bezier(0.4, 1.6, 0.5, 1);
}
.brief-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: rgba(220,230,245,0.5);
  margin-bottom: 1rem;
}
.brief-head .lvl {
  color: #5ee0c4;
  font-weight: 700;
}
.brief-card h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}
.brief-card p {
  color: rgba(220,230,245,0.65);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  margin: 0 0 1.4rem;
}
.brief-stats {
  display: flex;
  justify-content: center;
  gap: 2.4rem;
  margin-bottom: 1.6rem;
}
.bs {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.bs-num {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #fff;
}
.bs-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(220,230,245,0.45);
  margin-top: 4px;
}

/* === PLAY === */
.play {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  height: calc(100vh - 2.4rem);
}
.boards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  min-height: 0;
  overflow: hidden;
}
@media (max-width: 900px) {
  .boards { grid-template-columns: 1fr; overflow-y: auto; }
}

/* === END SCREENS === */
.end {
  align-items: center;
  justify-content: center;
}
.end-card {
  width: min(540px, 92vw);
  background: rgba(15,20,30,0.85);
  border: 1px solid rgba(120,140,200,0.22);
  border-radius: 20px;
  padding: 2.2rem 2rem 1.8rem;
  backdrop-filter: blur(16px);
  text-align: center;
  animation: zoomIn 0.6s cubic-bezier(0.4, 1.6, 0.5, 1);
  position: relative;
}
.end-card.win   { border-color: rgba(120,220,160,0.3); }
.end-card.lose  { border-color: rgba(255,90,122,0.3); }
.end-card.victory { border-color: rgba(255,200,80,0.4); box-shadow: 0 0 60px rgba(255,200,80,0.15); }

.end-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.8rem;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, rgba(120,220,160,0.2), rgba(94,224,196,0.2));
  border: 1px solid rgba(120,220,160,0.4);
  animation: popIn 0.5s cubic-bezier(0.4, 1.6, 0.5, 1);
}
.end-icon.big { width: 80px; height: 80px; font-size: 2.5rem; }
.lose .end-icon { background: rgba(255,90,122,0.15); border-color: rgba(255,90,122,0.4); }
.victory .end-icon { background: rgba(255,200,80,0.15); border-color: rgba(255,200,80,0.5); }

.end-card h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  margin: 0 0 0.4rem;
  letter-spacing: 0.06em;
}
.end-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: rgba(220,230,245,0.55);
  margin: 0 0 1.4rem;
}
.end-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.2rem;
}
.es { display: flex; flex-direction: column; align-items: center; }
.es-num {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  color: #fff;
}
.es-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(220,230,245,0.45);
  margin-top: 4px;
}
.end-total {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: rgba(220,230,245,0.7);
  margin-bottom: 1.4rem;
}
.end-total strong {
  font-family: 'Space Grotesk', sans-serif;
  color: #fff;
  font-size: 1.4rem;
}
.end-actions {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
}
.big-btn {
  padding: 0.8rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(120,140,200,0.3);
  color: #e9eef7;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s;
}
.big-btn:hover {
  border-color: rgba(120,140,200,0.6);
  background: rgba(120,140,200,0.08);
}
.big-btn.primary {
  background: linear-gradient(135deg, #5ee0c4, #6cc9f7);
  color: #0a1018;
  border: none;
  box-shadow: 0 8px 20px rgba(94,224,196,0.25);
}
.big-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(94,224,196,0.45);
}

/* confetti */
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.confetti span {
  position: absolute;
  top: -10px;
  left: calc(var(--i) * 3.3%);
  width: 8px;
  height: 14px;
  background: hsl(calc(var(--i) * 30), 80%, 60%);
  animation: fall 2.5s linear infinite;
  animation-delay: calc(var(--i) * -0.1s);
  transform-origin: center;
}
@keyframes fall {
  0%   { transform: translateY(0) rotate(0); opacity: 1; }
  100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
}

/* shared animations */
@keyframes popIn {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}

/* screen transitions */
.screen-enter-active, .screen-leave-active { transition: all 0.4s cubic-bezier(0.4, 1.2, 0.5, 1); }
.screen-enter-from { opacity: 0; transform: translateY(15px); }
.screen-leave-to   { opacity: 0; transform: translateY(-15px); }
</style>
