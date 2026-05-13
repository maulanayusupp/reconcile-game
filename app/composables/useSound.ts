// Web Audio API based sound engine — no binary files needed.
// All effects synthesized on the fly via oscillators + envelopes.

type SoundName =
  | 'click'
  | 'select'
  | 'deselect'
  | 'correct'
  | 'wrong'
  | 'combo'
  | 'tick'
  | 'levelUp'
  | 'gameOver'
  | 'start'
  | 'hover'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = false

function ensureCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.4
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function envelope(
  audioCtx: AudioContext,
  gainNode: GainNode,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  peak = 1,
) {
  const now = audioCtx.currentTime
  gainNode.gain.cancelScheduledValues(now)
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(peak, now + attack)
  gainNode.gain.linearRampToValueAtTime(sustain * peak, now + attack + decay)
  gainNode.gain.linearRampToValueAtTime(0, now + attack + decay + release)
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  options: { detune?: number; gain?: number; delay?: number; sweep?: number } = {},
) {
  const audioCtx = ensureCtx()
  if (!audioCtx || !masterGain || muted) return
  const { detune = 0, gain = 0.3, delay = 0, sweep = 0 } = options

  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.detune.value = detune

  const start = audioCtx.currentTime + delay
  if (sweep) {
    osc.frequency.setValueAtTime(freq, start)
    osc.frequency.linearRampToValueAtTime(freq + sweep, start + duration)
  }

  osc.connect(g)
  g.connect(masterGain)

  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.start(start)
  osc.stop(start + duration + 0.05)
}

function noise(duration: number, options: { gain?: number; filter?: number; delay?: number } = {}) {
  const audioCtx = ensureCtx()
  if (!audioCtx || !masterGain || muted) return
  const { gain = 0.2, filter = 1000, delay = 0 } = options

  const bufferSize = audioCtx.sampleRate * duration
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  const source = audioCtx.createBufferSource()
  source.buffer = buffer

  const bp = audioCtx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = filter
  bp.Q.value = 0.8

  const g = audioCtx.createGain()
  source.connect(bp)
  bp.connect(g)
  g.connect(masterGain)

  const start = audioCtx.currentTime + delay
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.start(start)
  source.stop(start + duration + 0.05)
}

const sounds: Record<SoundName, () => void> = {
  hover: () => tone(880, 0.04, 'sine', { gain: 0.05 }),
  click: () => tone(600, 0.06, 'square', { gain: 0.1 }),
  select: () => {
    tone(660, 0.08, 'triangle', { gain: 0.18 })
    tone(990, 0.08, 'sine', { gain: 0.08, delay: 0.02 })
  },
  deselect: () => tone(400, 0.07, 'triangle', { gain: 0.12 }),
  correct: () => {
    tone(523.25, 0.12, 'sine', { gain: 0.25 }) // C5
    tone(659.25, 0.12, 'sine', { gain: 0.22, delay: 0.07 }) // E5
    tone(783.99, 0.18, 'sine', { gain: 0.22, delay: 0.14 }) // G5
    tone(1046.5, 0.22, 'triangle', { gain: 0.15, delay: 0.21 }) // C6
  },
  wrong: () => {
    tone(180, 0.18, 'sawtooth', { gain: 0.22, sweep: -80 })
    noise(0.15, { gain: 0.08, filter: 400 })
  },
  combo: () => {
    tone(880, 0.08, 'square', { gain: 0.2 })
    tone(1108, 0.08, 'square', { gain: 0.18, delay: 0.06 })
    tone(1318, 0.12, 'square', { gain: 0.18, delay: 0.12 })
    tone(1760, 0.18, 'triangle', { gain: 0.15, delay: 0.18 })
  },
  tick: () => tone(1200, 0.03, 'square', { gain: 0.08 }),
  levelUp: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
    notes.forEach((f, i) => tone(f, 0.18, 'triangle', { gain: 0.2, delay: i * 0.09 }))
  },
  gameOver: () => {
    tone(440, 0.3, 'sawtooth', { gain: 0.22, sweep: -200 })
    tone(330, 0.4, 'sawtooth', { gain: 0.2, delay: 0.2, sweep: -150 })
    tone(220, 0.6, 'sawtooth', { gain: 0.18, delay: 0.5, sweep: -100 })
    noise(0.8, { gain: 0.05, filter: 200, delay: 0.3 })
  },
  start: () => {
    tone(523.25, 0.12, 'sine', { gain: 0.2 })
    tone(783.99, 0.12, 'sine', { gain: 0.22, delay: 0.08 })
    tone(1046.5, 0.2, 'triangle', { gain: 0.2, delay: 0.16 })
  },
}

export function useSound() {
  const play = (name: SoundName) => {
    if (typeof window === 'undefined') return
    try {
      sounds[name]?.()
    } catch (e) {
      // ignore audio errors
    }
  }

  const setMuted = (val: boolean) => {
    muted = val
    if (masterGain) masterGain.gain.value = val ? 0 : 0.4
  }

  const isMuted = () => muted

  const setVolume = (val: number) => {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, val))
  }

  return { play, setMuted, isMuted, setVolume }
}
