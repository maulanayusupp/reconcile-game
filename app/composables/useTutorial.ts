import { computed, reactive } from 'vue'
import type { ActionType } from './useLevels'

export type AdvanceTrigger = 'next' | 'select' | 'submit' | 'reset'

export interface TutorialStep {
  title: string
  message: string
  target?: string // value of data-tutorial attribute
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  advance: AdvanceTrigger
  expectRecordId?: string
  expectAction?: ActionType
  // Show a pointer arrow towards the target
  pointer?: boolean
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Reconcile',
    message:
      'You are the payment ops engineer for a small company. Every day, money flows through 3 different systems — your job is to make sure they agree. Let me walk you through it.',
    advance: 'next',
    position: 'center',
  },
  {
    title: '① Payment Gateway',
    message:
      'This column shows what users PAID. When someone taps their card, it lands here first. Status "captured" means money was taken.',
    target: 'panel-gateway',
    position: 'right',
    advance: 'next',
  },
  {
    title: '② Internal DB',
    message:
      'This column shows what YOUR APP recorded. Every checkout creates an order row here. Ideally it matches the gateway.',
    target: 'panel-db',
    position: 'top',
    advance: 'next',
  },
  {
    title: '③ Bank Settlement',
    message:
      'This column shows the money that ACTUALLY landed in your bank. Usually slightly less than the gateway amount because of the processing fee (MDR).',
    target: 'panel-bank',
    position: 'left',
    advance: 'next',
  },
  {
    title: 'The 3 must agree',
    message:
      'If all 3 sources line up for one transaction → easy, just mark as reconciled. If anything mismatches → you need to figure out why and take an action. Let\'s try one.',
    advance: 'next',
    position: 'center',
  },
  {
    title: 'Click this CoffeeCo card',
    message:
      'In the Gateway column, click the CoffeeCo card ($89.50). This selects it.',
    target: 'card-tut_g1',
    position: 'right',
    advance: 'select',
    expectRecordId: 'tut_g1',
    pointer: true,
  },
  {
    title: 'Now its match in DB',
    message:
      'Click the matching CoffeeCo card in Internal DB — same amount, same merchant.',
    target: 'card-tut_d1',
    position: 'right',
    advance: 'select',
    expectRecordId: 'tut_d1',
    pointer: true,
  },
  {
    title: 'And the bank record',
    message:
      'Click CoffeeCo in Bank Settlement. Notice it shows $86.82 — that\'s the $89.50 minus the ~3% processing fee. Normal!',
    target: 'card-tut_b1',
    position: 'left',
    advance: 'select',
    expectRecordId: 'tut_b1',
    pointer: true,
  },
  {
    title: 'Now hit Reconcile',
    message:
      'You\'ve covered the full transaction across all 3 systems. Click "Reconcile" to mark this transaction as resolved.',
    target: 'action-reconcile',
    position: 'top',
    advance: 'submit',
    expectAction: 'reconcile',
    pointer: true,
  },
  {
    title: 'Nice — first one cleared',
    message:
      'Score went up. Combo started. Now look at the second transaction: TechStore $145. There are only TWO records — Gateway and Bank, but no DB order!',
    advance: 'next',
    position: 'center',
  },
  {
    title: 'Select the TechStore in Gateway',
    message:
      'Click the TechStore card in the Gateway column.',
    target: 'card-tut_g2',
    position: 'right',
    advance: 'select',
    expectRecordId: 'tut_g2',
    pointer: true,
  },
  {
    title: 'And in Bank',
    message:
      'Click the TechStore card in Bank Settlement.',
    target: 'card-tut_b2',
    position: 'left',
    advance: 'select',
    expectRecordId: 'tut_b2',
    pointer: true,
  },
  {
    title: 'Money taken but no order',
    message:
      'The user paid, the money landed, but our system never created an order. We need to backfill it — click "Create Order".',
    target: 'action-create_order',
    position: 'top',
    advance: 'submit',
    expectAction: 'create_order',
    pointer: true,
  },
  {
    title: 'You did it!',
    message:
      'That\'s the core loop. Real levels have time limits, lives, and 7 different mismatch types — duplicates, partial refunds, chargebacks, fee variances, and more. Use the 💡 Hint button when stuck. Good luck!',
    advance: 'next',
    position: 'center',
  },
]

const _state = reactive({
  active: false,
  stepIdx: 0,
})

export function useTutorial() {
  const start = () => {
    _state.active = true
    _state.stepIdx = 0
  }

  const stop = () => {
    _state.active = false
    _state.stepIdx = 0
  }

  const next = () => {
    if (_state.stepIdx < TUTORIAL_STEPS.length - 1) {
      _state.stepIdx += 1
    } else {
      _state.active = false
    }
  }

  const currentStep = computed<TutorialStep | null>(() => {
    if (!_state.active) return null
    return TUTORIAL_STEPS[_state.stepIdx] ?? null
  })

  const onSelect = (recordId: string) => {
    if (!_state.active) return
    const step = TUTORIAL_STEPS[_state.stepIdx]
    if (step?.advance === 'select' && step.expectRecordId === recordId) {
      setTimeout(() => next(), 250)
    }
  }

  const onSubmit = (action: ActionType) => {
    if (!_state.active) return
    const step = TUTORIAL_STEPS[_state.stepIdx]
    if (step?.advance === 'submit' && step.expectAction === action) {
      setTimeout(() => next(), 400)
    }
  }

  return {
    state: _state,
    start,
    stop,
    next,
    currentStep,
    onSelect,
    onSubmit,
    total: computed(() => TUTORIAL_STEPS.length),
  }
}
