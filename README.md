<p align="center">
  <img src="fenspend/public/logo.png" alt="FenSpend Logo" width="120" />
</p>

# FenSpend 💸

A personal AI-supported finance project that started as an expense tracker and is growing into an explainable financial health platform. It combines spending records, portfolio analytics, and AI-generated explanations based on the financial data available to the application.

The project is intentionally built in layers: deterministic financial calculations first, then risk analysis, then AI reasoning over verified results. This keeps the AI useful without making it the source of financial truth.

**Live App:** [fen-spend.vercel.app](https://fen-spend.vercel.app)  
**Repo:** [github.com/meoyushi/FenSpend](https://github.com/meoyushi/FenSpend)

For the full architecture, implementation notes, and interview revision plan, see the [FenSpend guide](fenspend/docs/FENSPEND_GUIDE.md) and [master plan](fenspend/docs/FENSPEND_MASTER_PLAN.md).

---

## What Works Today

- Add, filter, sort, and delete expenses through Supabase
- View portfolio value, invested amount, P&L, return, holdings, and allocation
- Add and drop synthetic portfolio holdings while the server is running
- Generate financial-health explanations with Groq or the deterministic mock provider
- Keep custom portfolio holdings scoped by the logged-in email in the current demo flow

Portfolio holdings are currently synthetic and stored in memory. The next major step is durable investment storage and deterministic portfolio-risk strategies.

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
- **Portfolio intelligence** — track holdings, returns, P&L, asset allocation, and sector allocation
- **AI-supported financial health** — explain verified portfolio metrics through Groq or a local mock provider
- **Provider boundaries** — market-data and AI integrations can be replaced without changing portfolio business logic

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Full-stack in one repo; API Routes for backend logic; strong typing throughout |
| Styling | Tailwind CSS | Utility-first; fast to iterate without leaving JSX |
| Data and expense API | Supabase | Existing expense persistence and database access |
| Portfolio data | Mock provider | Deterministic data for development and demos |
| AI | Groq through OpenAI-compatible SDK | Generates explainable summaries on the server |
| Deployment | Vercel | Natural deployment target for Next.js |

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

The API uses Next.js Route Handlers. Expense routes talk to Supabase; portfolio and financial-health routes delegate to application services.

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

### `GET /api/portfolio?email={email}`

Returns the calculated portfolio summary for the requested demo user, including holdings, P&L, returns, and allocations.

### `POST /api/portfolio`

Adds a validated holding for a user and returns the recalculated portfolio summary.

### `DELETE /api/portfolio?email={email}&id={id}`

Drops a holding for the requested user and returns the recalculated summary.

### `GET /api/financial-health?email={email}`

Builds a verified `FinancialSnapshot` and sends it through the configured `AIProvider`. With `AI_PROVIDER=groq`, Groq generates the explanation. If Groq is temporarily unavailable, the API returns a deterministic mock insight from the same snapshot.

---

## Key Design Decisions

### 1. Supabase instead of a custom backend
For this personal project, Supabase's auto-generated REST API and Row Level Security (RLS) handle auth, data access, and user isolation without requiring a separate Express, Go, or Python backend.

### 2. Money as `numeric`, never `float`
A common mistake is storing money as a JavaScript `number` or a SQL `float`. Both can silently introduce rounding errors (e.g. `0.1 + 0.2 !== 0.3`). All amounts are stored as `numeric(12,2)` in Postgres and parsed to string/Decimal on the frontend before display.

### 3. Idempotent POST
The brief explicitly called out the scenario of a user clicking submit multiple times, or the page refreshing after a submit. A client-generated idempotency key (UUID v4, persisted in sessionStorage for the lifetime of the tab) is included in every POST. The API stores this key and returns the existing record if it has already been processed — the user sees the same outcome regardless of retries.

### 4. Filtering and totals happen server-side
Totals always reflect the *filtered* set, not all expenses. This is computed in the API response rather than client-side to ensure correctness even with pagination (if added later).

### 5. Auto-category suggestion (rule-based)
Rather than calling an ML API, a lightweight keyword map (Zomato → Food, Uber → Transport, etc.) runs client-side as the user types the description. It feels like AI, costs nothing, and adds zero latency.

### 6. AI explains data; it does not invent data

Portfolio values, returns, and allocations are calculated in TypeScript before the AI provider is called. The AI receives a structured snapshot, returns a validated JSON insight, and is instructed not to create metrics or give buy/sell predictions.

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
- **Real-time market data** — the provider interface is ready, but the current portfolio data is synthetic

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
# Fill in your Supabase URL and anon key. For real AI, set AI_PROVIDER=groq and add GROQ_API_KEY.

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
AI_PROVIDER=mock
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
```

---

## Project Structure

```
fenspend/
├── app/
│   ├── api/
│   │   ├── expenses/             # Expense API backed by Supabase
│   │   ├── portfolio/             # Portfolio API
│   │   └── financial-health/      # AI insight API
│   ├── portfolio/                 # Portfolio dashboard
│   ├── favicon.ico
│   ├── globals.css               # Theme, animations, dark mode base styles
│   ├── layout.tsx                # Root layout, fonts, metadata
│   └── page.tsx                  # Login + Dashboard UI
├── application/                  # Use cases and orchestration
├── domain/                       # Framework-independent financial rules
├── infrastructure/               # Market-data and AI adapters
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
├── .env                          # Local-only environment variables
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
- **Code structure:** Presentation, application, domain, and infrastructure responsibilities are separated
- **AI safety:** Provider output is validated, server-side keys stay private, and Groq has a deterministic fallback

---

*Built with Next.js, TypeScript, Supabase, Tailwind CSS, and Groq. Deployed on Vercel.*

*Aayushi🌸*
