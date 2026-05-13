# Reconcile — Payment Ops Puzzle Game

## Konsep

Player berperan sebagai **Payment Ops Engineer**. Setelah deployment buggy, data transaksi jadi inconsistent antara 3 sumber:

- **Payment Gateway** (mis. Stripe/PayNow) — apa yang user bayar
- **Internal DB** (order/checkout system) — apa yang aplikasi catat
- **Bank Settlement** — uang yang benar-benar masuk ke merchant

Tugas player: **match** record dari ketiga sumber untuk cari mismatch, lalu pilih action yang tepat (refund, manual capture, mark as duplicate, escalate, dll).

Tone: santai tapi otentik. Mirip kerja oncall pas weekend incident.

---

## Core Loop

```
[Round mulai] → [Lihat 3 panel transaksi] → [Drag/click match] →
[Resolve mismatch (action)] → [Time/accuracy scoring] → [Round selesai]
```

1. Tiap round = 1 "incident batch" dengan N transaksi (mulai 5, naik tiap level)
2. Player punya batas waktu (mis. 90 detik)
3. Setiap match benar = +points. Salah = -points + customer complaint counter naik
4. Kalau customer complaint > threshold → game over (merchant cabut)

---

## Mismatch Types (mulai dari mudah ke susah)

| Tipe | Contoh | Action yang benar |
|---|---|---|
| **Perfect match** | Gateway $100, DB $100, Bank $100 | Mark reconciled |
| **Missing in DB** | Gateway captured, DB tidak ada order | Manual create order / refund |
| **Missing in Gateway** | DB ada order pending, gateway tidak charge | Cancel order |
| **Amount mismatch** | Gateway $100, Bank $97 | Cek MDR (fee) — kalau valid, reconciled |
| **Duplicate charge** | Gateway 2x $100, DB 1x order $100 | Refund 1, keep 1 |
| **Partial refund** | Gateway $100 - $30 refund, DB $70 | Match dengan refund record |
| **Chargeback** | Bank deduct $100 setelah 2 minggu | Mark dispute, escalate |
| **Currency conversion** | Gateway SGD 100, Bank IDR 1.1jt | Cek exchange rate window |

---

## Progression / Level Design

- **Level 1–3**: Tutorial. Hanya perfect match + missing records. Tidak ada time pressure.
- **Level 4–6**: Amount mismatch + duplicate. Time pressure muncul.
- **Level 7–9**: Partial refund, chargeback. Volume naik.
- **Level 10+**: Multi-currency, hidden patterns (mis. fraud ring dengan 5 transaksi kecil identik).
- **Boss level**: "Black Friday outage" — 30 transaksi dalam 60 detik.

---

## Scoring

- Match benar: +100
- Match salah: -50, customer complaint +1
- Bonus speed: sisa waktu × 10
- Combo: 3 match berturut tanpa salah = 2x multiplier
- Achievement: "Reconcile 100 transaksi tanpa error", "Catch first chargeback", dll

---

## Tech Stack (MVP)

Konsisten dengan game lain di repo ini (vanilla, no build step):

- **HTML/CSS/JS** vanilla — 1 file `index.html`, 1 file `game.js`, 1 file `style.css`
- **Data**: JSON file `levels.json` untuk definisi tiap level
- **Storage**: `localStorage` untuk high score & progress

Kalau MVP sukses dan player suka, baru pindah ke framework (Vue/React) atau Phaser.

---

## File Structure (MVP)

```
reconcile-game/
├── PLAN.md              ← ini
├── index.html           ← UI shell (3 panel + action bar + timer)
├── style.css            ← styling, terminal-ish look
├── game.js              ← game state, scoring, level loader
├── data/
│   └── levels.json      ← level definitions
└── assets/
    └── (sfx & icons nanti)
```

---

## MVP Scope (Phase 1)

Yang dibangun pertama:

- [x] Folder + plan ✅
- [ ] HTML shell: 3 kolom (Gateway / DB / Bank), action panel di bawah
- [ ] Render 1 level statis (5 transaksi, 2 jenis mismatch)
- [ ] Drag-to-match interaction
- [ ] Action buttons: Reconcile / Refund / Escalate
- [ ] Score counter + timer
- [ ] Round end screen

**Goal**: 1 level playable end-to-end. ~2-3 jam coding.

---

## Phase 2 (kalau MVP fun)

- 10 level dengan progression curve
- Sound effects (cash register, error buzz)
- Animasi card pas match
- "Daily challenge" mode (random seed per hari)
- Leaderboard via localStorage

---

## Phase 3 (stretch)

- Multi-merchant mode (player handle beberapa merchant sekaligus)
- "Story mode" dengan narrative incident (mis. "Subuh Senin, CTO WA lo: 'Bro, kenapa settlement Sabtu off by $50K'")
- Mobile-friendly layout
- Share score ke social media

---

## Pertanyaan untuk Diputuskan

1. **Visual style**: terminal/spreadsheet vibe (Excel-like) ATAU lebih playful (kartu warna-warni)?
2. **Drag-drop vs click-to-select**: drag lebih intuitif tapi susah di mobile
3. **Bahasa UI**: Indonesia, English, atau toggle?
4. **Realistis vs gamey**: pakai term beneran (MDR, settlement, chargeback) atau disederhanakan (fee, payout, dispute)?
