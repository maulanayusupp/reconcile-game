import { computed, reactive, ref } from 'vue'
import {
  generateLevel,
  generateTutorialLevel,
  flatRecords,
  type ActionType,
  type Level,
  type Source,
  type TxGroup,
  type TxRecord,
} from './useLevels'
import { useSound } from './useSound'
import { useTutorial } from './useTutorial'

export type GameState = 'menu' | 'briefing' | 'playing' | 'roundEnd' | 'gameOver' | 'victory'

export interface Feedback {
  id: number
  type: 'correct' | 'wrong' | 'info'
  text: string
  x?: number
  y?: number
}

export interface ToastMsg {
  id: number
  text: string
  variant: 'success' | 'error' | 'info'
}

const _state = reactive({
  state: 'menu' as GameState,
  levelNum: 1,
  totalScore: 0,
  roundScore: 0,
  combo: 0,
  bestCombo: 0,
  complaints: 0,
  resolved: 0,
  timeLeft: 0,
  level: null as Level | null,
  selected: [] as string[], // record ids
  feedback: [] as Feedback[],
  toasts: [] as ToastMsg[],
  recordStates: {} as Record<string, 'idle' | 'selected' | 'matched' | 'wrong'>,
  groupStates: {} as Record<string, 'pending' | 'resolved' | 'flagged'>,
  highScore: 0,
  hintsUsed: 0,
})

let timerId: ReturnType<typeof setInterval> | null = null
let toastId = 0
let feedbackId = 0

const MAX_LEVEL = 5

export function useGame() {
  const sound = useSound()
  const tutorial = useTutorial()

  const startGame = () => {
    sound.play('start')
    _state.totalScore = 0
    _state.complaints = 0
    _state.bestCombo = 0
    _state.levelNum = 1
    tutorial.stop()
    loadLevel(1)
  }

  const startTutorial = () => {
    sound.play('start')
    _state.totalScore = 0
    _state.complaints = 0
    _state.bestCombo = 0
    const lv = generateTutorialLevel()
    _state.level = lv
    _state.levelNum = 0
    _state.roundScore = 0
    _state.combo = 0
    _state.resolved = 0
    _state.timeLeft = 9999
    _state.selected = []
    _state.feedback = []
    _state.recordStates = {}
    _state.groupStates = {}
    _state.hintsUsed = 0
    flatRecords(lv).forEach(r => (_state.recordStates[r.id] = 'idle'))
    lv.groups.forEach(g => (_state.groupStates[g.txId] = 'pending'))
    _state.state = 'playing'
    tutorial.start()
  }

  const loadLevel = (num: number) => {
    const lv = generateLevel(num)
    _state.level = lv
    _state.levelNum = num
    _state.roundScore = 0
    _state.combo = 0
    _state.resolved = 0
    _state.timeLeft = lv.timeLimit
    _state.selected = []
    _state.feedback = []
    _state.recordStates = {}
    _state.groupStates = {}
    _state.hintsUsed = 0
    flatRecords(lv).forEach(r => (_state.recordStates[r.id] = 'idle'))
    lv.groups.forEach(g => (_state.groupStates[g.txId] = 'pending'))
    _state.state = 'briefing'
  }

  const beginRound = () => {
    _state.state = 'playing'
    startTimer()
  }

  const startTimer = () => {
    stopTimer()
    timerId = setInterval(() => {
      if (_state.state !== 'playing') return
      _state.timeLeft -= 1
      if (_state.timeLeft <= 10 && _state.timeLeft > 0) sound.play('tick')
      if (_state.timeLeft <= 0) {
        _state.timeLeft = 0
        endRound(false, 'Time up')
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timerId) clearInterval(timerId)
    timerId = null
  }

  const toggleSelect = (recordId: string) => {
    if (_state.state !== 'playing') return
    const rs = _state.recordStates[recordId]
    if (rs === 'matched') return

    const idx = _state.selected.indexOf(recordId)
    if (idx >= 0) {
      _state.selected.splice(idx, 1)
      _state.recordStates[recordId] = 'idle'
      sound.play('deselect')
    } else {
      _state.selected.push(recordId)
      _state.recordStates[recordId] = 'selected'
      sound.play('select')
      tutorial.onSelect(recordId)
    }
  }

  const clearSelection = () => {
    _state.selected.forEach(id => {
      if (_state.recordStates[id] === 'selected') _state.recordStates[id] = 'idle'
    })
    _state.selected = []
  }

  const findGroupForSelection = (): TxGroup | null => {
    if (!_state.level || _state.selected.length === 0) return null
    const groups = _state.level.groups
    for (const g of groups) {
      if (_state.groupStates[g.txId] === 'resolved') continue
      const gIds = new Set(g.records.map(r => r.id))
      const allInGroup = _state.selected.every(id => gIds.has(id))
      const coversGroup = g.records.every(r => _state.selected.includes(r.id))
      if (allInGroup && coversGroup) return g
    }
    return null
  }

  const submitAction = (action: ActionType) => {
    if (_state.state !== 'playing') return
    if (_state.selected.length === 0) {
      pushToast('Select records first', 'info')
      return
    }

    const group = findGroupForSelection()
    if (!group) {
      // selection doesn't fully match a group
      pushFeedback('wrong', 'Selection must cover one full transaction group')
      sound.play('wrong')
      _state.combo = 0
      _state.complaints += 1
      _state.recordStates = { ..._state.recordStates }
      _state.selected.forEach(id => (_state.recordStates[id] = 'wrong'))
      setTimeout(() => {
        _state.selected.forEach(id => {
          if (_state.recordStates[id] === 'wrong') _state.recordStates[id] = 'idle'
        })
        _state.selected = []
      }, 400)
      checkGameOver()
      return
    }

    if (action === group.expectedAction) {
      // correct
      const comboMult = 1 + Math.min(_state.combo * 0.2, 1) // up to 2x
      const timeBonus = Math.max(0, _state.timeLeft) * 2
      const gained = Math.round(group.reward * comboMult + timeBonus / 10)
      _state.combo += 1
      _state.bestCombo = Math.max(_state.bestCombo, _state.combo)
      _state.roundScore += gained
      _state.totalScore += gained
      _state.resolved += 1
      _state.groupStates[group.txId] = 'resolved'
      _state.selected.forEach(id => (_state.recordStates[id] = 'matched'))
      pushFeedback('correct', `+${gained}${_state.combo > 1 ? ` · ${_state.combo}x` : ''}`)
      if (_state.combo >= 3) sound.play('combo')
      else sound.play('correct')
      _state.selected = []
      tutorial.onSubmit(action)

      if (_state.resolved === _state.level!.groups.length) {
        if (tutorial.state.active) {
          // tutorial ends naturally after both transactions
          // don't trigger endRound — tutorial handles its own flow
        } else {
          endRound(true)
        }
      }
    } else {
      pushFeedback('wrong', `Wrong action — try ${group.expectedAction.replace('_', ' ')}`)
      sound.play('wrong')
      _state.combo = 0
      _state.complaints += 1
      _state.selected.forEach(id => (_state.recordStates[id] = 'wrong'))
      setTimeout(() => {
        _state.selected.forEach(id => {
          if (_state.recordStates[id] === 'wrong') _state.recordStates[id] = 'idle'
        })
        _state.selected = []
      }, 400)
      checkGameOver()
    }
  }

  const useHint = () => {
    if (!_state.level || _state.state !== 'playing') return
    _state.hintsUsed += 1
    const firstPending = _state.level.groups.find(g => _state.groupStates[g.txId] === 'pending')
    if (firstPending) {
      pushToast(firstPending.hint, 'info')
      // flash the records
      firstPending.records.forEach(r => (_state.recordStates[r.id] = 'wrong'))
      setTimeout(() => {
        firstPending.records.forEach(r => {
          if (_state.recordStates[r.id] === 'wrong') _state.recordStates[r.id] = 'idle'
        })
      }, 500)
    }
  }

  const checkGameOver = () => {
    if (!_state.level) return
    if (_state.complaints >= _state.level.maxComplaints) {
      endRound(false, 'Too many complaints — merchant left')
    }
  }

  const endRound = (passed: boolean, reason?: string) => {
    stopTimer()
    if (passed) {
      sound.play('levelUp')
      _state.state = 'roundEnd'
      _state.highScore = Math.max(_state.highScore, _state.totalScore)
      saveHighScore()
    } else {
      sound.play('gameOver')
      _state.state = 'gameOver'
      _state.highScore = Math.max(_state.highScore, _state.totalScore)
      saveHighScore()
      if (reason) pushToast(reason, 'error')
    }
  }

  const nextLevel = () => {
    if (_state.levelNum >= MAX_LEVEL) {
      _state.state = 'victory'
      return
    }
    loadLevel(_state.levelNum + 1)
  }

  const backToMenu = () => {
    stopTimer()
    tutorial.stop()
    _state.state = 'menu'
  }

  const finishTutorial = () => {
    tutorial.stop()
    _state.state = 'menu'
  }

  const pushFeedback = (type: Feedback['type'], text: string) => {
    const fb: Feedback = { id: ++feedbackId, type, text }
    _state.feedback.push(fb)
    setTimeout(() => {
      _state.feedback = _state.feedback.filter(f => f.id !== fb.id)
    }, 1500)
  }

  const pushToast = (text: string, variant: ToastMsg['variant'] = 'info') => {
    const t: ToastMsg = { id: ++toastId, text, variant }
    _state.toasts.push(t)
    setTimeout(() => {
      _state.toasts = _state.toasts.filter(x => x.id !== t.id)
    }, 3200)
  }

  const saveHighScore = () => {
    if (typeof window === 'undefined') return
    try {
      const prev = parseInt(localStorage.getItem('reconcile_highscore') || '0', 10)
      if (_state.totalScore > prev) {
        localStorage.setItem('reconcile_highscore', String(_state.totalScore))
      }
    } catch (e) { /* ignore */ }
  }

  const loadHighScore = () => {
    if (typeof window === 'undefined') return
    try {
      _state.highScore = parseInt(localStorage.getItem('reconcile_highscore') || '0', 10) || 0
    } catch (e) { _state.highScore = 0 }
  }

  const recordsForSource = (src: Source) => {
    if (!_state.level) return [] as TxRecord[]
    return flatRecords(_state.level).filter(r => r.source === src)
  }

  return {
    state: _state,
    startGame,
    startTutorial,
    finishTutorial,
    loadLevel,
    beginRound,
    toggleSelect,
    clearSelection,
    submitAction,
    useHint,
    nextLevel,
    backToMenu,
    loadHighScore,
    recordsForSource,
    // computed helpers
    isPlaying: computed(() => _state.state === 'playing'),
    progress: computed(() => {
      if (!_state.level) return 0
      return _state.resolved / _state.level.groups.length
    }),
  }
}
