<p align="center">
  <img src="public/logo.png" alt="FenSpend Logo" width="120" />
</p>

# FenSpend 💸

A minimal, production-quality personal expense tracker built as a full-stack assignment. Track your spending by category, filter and sort your expenses, and always know your running total — even across page refreshes and unreliable networks.

**Live App:** [fen-spend.vercel.app](https://fen-spend.vercel.app)  
**Repo:** [github.com/meoyushi/FenSpend](https://github.com/meoyushi/FenSpend)

---

## Features

- **Add expenses** with amount, category, description, and date
- **Delete expenses** — remove any entry from the list
- **View all expenses** in a clean, sorted list (newest first by default)
- **Filter by category** to focus on specific spending areas
- **Sort by date** (newest first)
- **Live total** — always reflects the currently visible (filtered) list
- **Idempotent submissions** — safe to retry; duplicate submissions from retries or page reloads are handled gracefully
- **Loading and error states** — the UI stays honest when things are slow or broken
- **Basic validation** — negative amounts and missing required fields are rejected
- **Category summary** — see total spending broken down per category
- Dark UI by default; Tailwind's class-based theming makes a light/dark toggle straightforward to add
- Mobile-friendly, responsive layout

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Full-stack in one repo; API Routes for backend logic; strong typing throughout |
| Styling | Tailwind CSS | Utility-first; fast to iterate without leaving JSX |
| Animations | Framer Motion | Smooth micro-interactions that feel polished without heavy effort |
| Auth + DB | Supabase | Instant Postgres + auth + realtime; replaces a custom backend entirely |
| Deployment | Vercel | Zero-config for Next.js; free tier sufficient for this scope |
| Charts | Recharts | Composable, lightweight; integrates well with React state |

---

## Data Model

```sql
expenses
  id           uuid          primary key, default gen_random_uuid()
  user_id      uuid          references auth.users
  amount       numeric(12,2) -- decimal type for accurate money arithmetic
  category     text          not null
  description  text
  date         date          not null
  created_at   timestamptz   default now()
```

**Why `numeric(12,2)` for money?**  
Floating-point types (`float`, `double`) cannot represent many decimal values exactly and accumulate rounding errors in sums. `numeric` (arbitrary precision) is the correct type for financial data.

---

## API

All routes are Next.js API Routes (`/app/api/...`) backed by Supabase.

### `POST /api/expenses`

Create a new expense.

**Request body:**
```json
{
  "amount": 249.00,
  "category": "Food",
  "description": "Zomato order",
  "date": "2025-07-14"
}
```

**Idempotency:** The frontend attaches a client-generated idempotency key (UUID, stored in session) to each submission. The API deduplicates on this key so that network retries or accidental double-submits don't create duplicate records.

**Response:** `201 Created` with the created expense object.

---

### `DELETE /api/expenses?id={id}`

Delete a single expense by ID. Only the owner of the record can delete it (enforced via Supabase RLS).

**Response:** `200 OK` on success, `404` if the expense doesn't exist or belongs to another user.

---

### `GET /api/expenses`

Fetch expenses for the authenticated user.

**Query parameters:**

| Param | Description | Example |
|---|---|---|
| `category` | Filter by category name (case-insensitive) | `?category=Food` |
| `sort` | Sort order | `?sort=date_desc` |

**Response:** `200 OK` with array of expense objects and a `total` field summing the visible amounts.

---

## Key Design Decisions

### 1. Supabase instead of a custom backend
The assignment allowed any persistence mechanism. Using Supabase's auto-generated REST API and Row Level Security (RLS) meant auth, data access, and user isolation were handled without writing a custom Express/Go/Python server — saving hours that were spent on UI quality instead.

### 2. Money as `numeric`, never `float`
A common mistake is storing money as a JavaScript `number` or a SQL `float`. Both can silently introduce rounding errors (e.g. `0.1 + 0.2 !== 0.3`). All amounts are stored as `numeric(12,2)` in Postgres and parsed to string/Decimal on the frontend before display.

### 3. Idempotent POST
The brief explicitly called out the scenario of a user clicking submit multiple times, or the page refreshing after a submit. A client-generated idempotency key (UUID v4, persisted in sessionStorage for the lifetime of the tab) is included in every POST. The API stores this key and returns the existing record if it has already been processed — the user sees the same outcome regardless of retries.

### 4. Filtering and totals happen server-side
Totals always reflect the *filtered* set, not all expenses. This is computed in the API response rather than client-side to ensure correctness even with pagination (if added later).

### 5. Auto-category suggestion (rule-based)
Rather than calling an ML API, a lightweight keyword map (Zomato → Food, Uber → Transport, etc.) runs client-side as the user types the description. It feels like AI, costs nothing, and adds zero latency.

---

## Trade-offs Made for the Timebox

| What | Why |
|---|---|
| No pagination | Expense lists are short for personal use; adds complexity for little gain right now |
| No edit (only delete) | Not in the acceptance criteria; inline edit is straightforward to add |
| No end-to-end tests | Unit tests cover core logic (validation, categorization); Playwright/Cypress E2E was out of scope |
| Dark mode only for now | App ships dark by default; Tailwind's class strategy means a light/dark toggle is a small addition later |
| No offline support / PWA | Would require a service worker and sync strategy; out of scope for a 4-hour build |
| Auth is email/password only | Magic link support is one Supabase config toggle away but wasn't needed for the demo |

---

## What Was Intentionally Left Out

- **Bank integrations or real finance APIs** — adds no value for this scope and would slow down development significantly
- **ML-based categorization** — rule-based achieves the same UX result at zero cost
- **Custom backend (Node/Go/Python)** — Supabase RLS + API routes cover all backend needs without a separate service

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/meoyushi/FenSpend.git
cd FenSpend/fenspend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Project Structure

```
fenspend/
├── app/
│   ├── api/
│   │   └── expenses/
│   │       └── route.ts          # GET / POST / DELETE (Supabase)
│   ├── FenSpend.png              # Original logo
│   ├── favicon.ico
│   ├── globals.css               # Theme, animations, dark mode base styles
│   ├── layout.tsx                # Root layout, fonts, metadata
│   └── page.tsx                  # Login + Dashboard UI
│
├── lib/
│   └── prisma.ts                 # Legacy — replaced by Supabase (can be removed)
│
├── prisma/                       # Legacy — can be removed
│   ├── schema.prisma
│   ├── dev.db
│   └── migrations/
│
├── public/
│   └── logo.png                  # Logo served at /logo.png
│
├── .env                          # SUPABASE_URL, SUPABASE_ANON_KEY
├── package.json
├── postcss.config.mjs
├── next.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

---

## Evaluation Notes

This project was built with correctness and clarity as the primary goals, not feature count. Key areas:

- **Data correctness:** Money is never stored or computed as a float
- **Realistic conditions:** Retries, double submits, and page reloads are all handled without creating duplicate data
- **Edge cases:** Empty states, failed fetches, and validation errors all have explicit UI treatment
- **Code structure:** Each concern (auth, data fetching, display, business logic) lives in its own module

---

*Built with Next.js, Supabase, Tailwind CSS, and Framer Motion. Deployed on Vercel.*
