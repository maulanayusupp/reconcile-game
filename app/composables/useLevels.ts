// Level generator — produces sets of transactions with intentional mismatches.

export type Source = 'gateway' | 'db' | 'bank'

export type TxStatus = 'captured' | 'pending' | 'refunded' | 'failed' | 'settled'

export interface TxRecord {
  id: string
  txId: string // group id linking related records across sources
  source: Source
  amount: number
  currency: string
  status: TxStatus
  timestamp: string
  merchant?: string
  matched?: boolean
  flagged?: boolean
}

export type MismatchType =
  | 'perfect'
  | 'missing_db'
  | 'missing_gateway'
  | 'amount_mismatch_fee'
  | 'duplicate_charge'
  | 'partial_refund'
  | 'chargeback'

export type ActionType = 'reconcile' | 'refund' | 'create_order' | 'cancel_order' | 'escalate'

export interface TxGroup {
  txId: string
  type: MismatchType
  records: TxRecord[]
  expectedAction: ActionType
  hint: string
  reward: number
}

export interface Level {
  number: number
  title: string
  brief: string
  groups: TxGroup[]
  timeLimit: number // seconds
  passingScore: number
  maxComplaints: number
}

const merchants = ['CoffeeCo', 'NasiPadang', 'TechStore', 'BookHub', 'SneakerLab', 'KopiKenangan', 'GoStore']
const currencies = ['SGD', 'IDR', 'MYR']

let _id = 0
const uid = (prefix = 'r') => `${prefix}_${++_id}_${Math.random().toString(36).slice(2, 6)}`

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randAmount(min = 10, max = 500) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randTimestamp() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60))
  return now.toISOString().slice(11, 19)
}

function rec(over: Partial<TxRecord> & { source: Source; txId: string }): TxRecord {
  return {
    id: uid('rec'),
    amount: randAmount(),
    currency: 'SGD',
    status: 'captured',
    timestamp: randTimestamp(),
    merchant: rand(merchants),
    matched: false,
    flagged: false,
    ...over,
  }
}

function makeGroup(type: MismatchType, opts: { id?: number } = {}): TxGroup {
  const txId = uid('tx')
  const merchant = rand(merchants)
  const amount = randAmount()
  const ts = randTimestamp()
  const currency = 'SGD'

  switch (type) {
    case 'perfect': {
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'db', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'bank', amount: Math.round(amount * 0.97 * 100) / 100, currency, status: 'settled', timestamp: ts, merchant }),
        ],
        expectedAction: 'reconcile',
        hint: 'All three sources align (bank shows net of fee). Reconcile.',
        reward: 100,
      }
    }
    case 'missing_db': {
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'bank', amount: Math.round(amount * 0.97 * 100) / 100, currency, status: 'settled', timestamp: ts, merchant }),
        ],
        expectedAction: 'create_order',
        hint: 'Captured at gateway but no order in DB — create order to backfill.',
        reward: 150,
      }
    }
    case 'missing_gateway': {
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'db', amount, currency, status: 'pending', timestamp: ts, merchant }),
        ],
        expectedAction: 'cancel_order',
        hint: 'DB shows pending order with no gateway charge — cancel the order.',
        reward: 120,
      }
    }
    case 'amount_mismatch_fee': {
      // Bank net differs from gateway gross but it's just MDR
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'db', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'bank', amount: Math.round(amount * 0.95 * 100) / 100, currency, status: 'settled', timestamp: ts, merchant }),
        ],
        expectedAction: 'reconcile',
        hint: 'Bank shows lower amount but matches the MDR fee — safe to reconcile.',
        reward: 130,
      }
    }
    case 'duplicate_charge': {
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'db', amount, currency, status: 'captured', timestamp: ts, merchant }),
        ],
        expectedAction: 'refund',
        hint: 'Two identical charges at gateway, one order in DB — refund the duplicate.',
        reward: 180,
      }
    }
    case 'partial_refund': {
      const refund = Math.round(amount * 0.3 * 100) / 100
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'gateway', amount: refund, currency, status: 'refunded', timestamp: ts, merchant }),
          rec({ txId, source: 'db', amount: amount - refund, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'bank', amount: Math.round((amount - refund) * 0.97 * 100) / 100, currency, status: 'settled', timestamp: ts, merchant }),
        ],
        expectedAction: 'reconcile',
        hint: 'Partial refund issued — DB and bank already reflect the net. Reconcile.',
        reward: 200,
      }
    }
    case 'chargeback': {
      return {
        txId,
        type,
        records: [
          rec({ txId, source: 'gateway', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'db', amount, currency, status: 'captured', timestamp: ts, merchant }),
          rec({ txId, source: 'bank', amount: -amount, currency, status: 'failed', timestamp: ts, merchant, flagged: true }),
        ],
        expectedAction: 'escalate',
        hint: 'Bank deducted full amount — likely chargeback dispute. Escalate to ops team.',
        reward: 220,
      }
    }
  }
}

export const ACTION_LABELS: Record<ActionType, string> = {
  reconcile: 'Reconcile',
  refund: 'Refund',
  create_order: 'Create Order',
  cancel_order: 'Cancel Order',
  escalate: 'Escalate',
} as any

export const ACTION_DESC: Record<ActionType, string> = {
  reconcile: 'Mark all records as matched',
  refund: 'Refund a duplicate or fraudulent charge',
  create_order: 'Backfill missing internal order',
  cancel_order: 'Cancel orphaned pending order',
  escalate: 'Send to ops team for review',
} as any

export const MISMATCH_LABELS: Record<MismatchType, string> = {
  perfect: 'Clean Match',
  missing_db: 'Missing in DB',
  missing_gateway: 'Orphan Order',
  amount_mismatch_fee: 'Fee Difference',
  duplicate_charge: 'Duplicate Charge',
  partial_refund: 'Partial Refund',
  chargeback: 'Chargeback',
}

export function generateLevel(num: number): Level {
  const compositions: Record<number, MismatchType[]> = {
    1: ['perfect', 'perfect', 'missing_db', 'missing_gateway'],
    2: ['perfect', 'missing_db', 'missing_gateway', 'amount_mismatch_fee', 'duplicate_charge'],
    3: ['missing_db', 'duplicate_charge', 'partial_refund', 'amount_mismatch_fee', 'perfect', 'chargeback'],
    4: ['duplicate_charge', 'partial_refund', 'chargeback', 'missing_gateway', 'amount_mismatch_fee', 'missing_db', 'perfect'],
    5: ['chargeback', 'duplicate_charge', 'partial_refund', 'duplicate_charge', 'missing_db', 'amount_mismatch_fee', 'chargeback', 'perfect'],
  }

  const mix = compositions[num] ?? compositions[5]
  const groups = mix.map(t => makeGroup(t))

  const titles: Record<number, string> = {
    1: 'Tutorial — Friday morning',
    2: 'Monday Surge',
    3: 'Refund Season',
    4: 'Chargeback Hell',
    5: 'Black Friday Outage',
  }
  const briefs: Record<number, string> = {
    1: 'Light batch. Get familiar with matching records across the 3 systems.',
    2: 'Weekend traffic backlog. Duplicates start appearing.',
    3: 'Customer service pushed a refund wave. Watch the partials.',
    4: 'Disputes flooding in. Escalate the chargebacks, fast.',
    5: 'Production fire. Everything is on fire. You are the only one online.',
  }

  return {
    number: num,
    title: titles[num] ?? `Wave ${num}`,
    brief: briefs[num] ?? 'Reconcile fast. Stay calm.',
    groups,
    timeLimit: Math.max(60, 150 - num * 15),
    passingScore: groups.length * 80,
    maxComplaints: Math.max(2, 5 - Math.floor(num / 2)),
  }
}

export function generateTutorialLevel(): Level {
  // Fixed deck — known IDs so tutorial steps can target specific cards.
  const tx1: TxGroup = {
    txId: 'tut_tx_1',
    type: 'perfect',
    records: [
      { id: 'tut_g1', txId: 'tut_tx_1', source: 'gateway', amount: 89.50, currency: 'SGD', status: 'captured', timestamp: '10:24:15', merchant: 'CoffeeCo', matched: false, flagged: false },
      { id: 'tut_d1', txId: 'tut_tx_1', source: 'db',      amount: 89.50, currency: 'SGD', status: 'captured', timestamp: '10:24:16', merchant: 'CoffeeCo', matched: false, flagged: false },
      { id: 'tut_b1', txId: 'tut_tx_1', source: 'bank',    amount: 86.82, currency: 'SGD', status: 'settled',  timestamp: '10:24:15', merchant: 'CoffeeCo', matched: false, flagged: false },
    ],
    expectedAction: 'reconcile',
    hint: 'All three sources align. Reconcile.',
    reward: 100,
  }
  const tx2: TxGroup = {
    txId: 'tut_tx_2',
    type: 'missing_db',
    records: [
      { id: 'tut_g2', txId: 'tut_tx_2', source: 'gateway', amount: 145.00, currency: 'SGD', status: 'captured', timestamp: '10:31:42', merchant: 'TechStore', matched: false, flagged: false },
      { id: 'tut_b2', txId: 'tut_tx_2', source: 'bank',    amount: 140.65, currency: 'SGD', status: 'settled',  timestamp: '10:31:42', merchant: 'TechStore', matched: false, flagged: false },
    ],
    expectedAction: 'create_order',
    hint: 'Captured at gateway but no DB order — backfill it.',
    reward: 150,
  }
  return {
    number: 0,
    title: 'Tutorial',
    brief: 'Learn the basics — no time pressure.',
    groups: [tx1, tx2],
    timeLimit: 99999,
    passingScore: 0,
    maxComplaints: 99,
  }
}

export function flatRecords(level: Level): TxRecord[] {
  return level.groups.flatMap(g => g.records)
}

export function recordsBySource(level: Level, source: Source): TxRecord[] {
  return flatRecords(level).filter(r => r.source === source)
}
