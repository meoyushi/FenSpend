# FenSpend: Build and Interview Guide

This is the living engineering guide for your FenSpend personal project and its AI Financial Health Platform direction. Update it whenever a module, data source, or design decision changes.

## Product direction

FenSpend is evolving from an expense tracker into a financial intelligence platform:

1. Expenses: record, filter, and summarize spending.
2. Portfolio intelligence: calculate investment value, returns, and allocation.
3. Portfolio risk: detect measurable concentration, volatility, drawdown, correlation, and diversification risks.
4. Financial health: explain spending and investment signals using verified structured data.

The order matters. Deterministic financial calculations come before an LLM. An AI provider may explain trusted results, but it must not invent or recalculate them.

## Current implementation

### Stack

| Concern | Current choice |
|---|---|
| Web framework | Next.js 16 App Router |
| Language | TypeScript with strict mode |
| UI | React 19 and Tailwind CSS 4 |
| Expense persistence | Supabase Postgres through `/app/api/expenses/route.ts` |
| Portfolio data | `MockMarketDataProvider` with synthetic holdings |
| AI layer | Configurable `MockAIProvider` or Groq through `GroqAIProvider` |
| Legacy data layer | Prisma and SQLite remain in `prisma/`, but are not the active expense path |
| Deployment target | Vercel |

### Request flow

#### Expenses

`app/page.tsx` -> `GET/POST/DELETE /api/expenses` -> Supabase `expenses` table

The page currently owns most expense UI state. Preserve this working flow while extracting business logic gradually.

#### Portfolio

`app/portfolio/page.tsx` or `GET /api/portfolio` -> `PortfolioService` -> `MarketDataProvider` -> `calculatePortfolioSummary`

The domain calculator only receives typed investments. It knows nothing about Next.js, Supabase, Prisma, or React. Values are represented as integer paise to avoid floating-point money errors.

#### Financial health AI

`app/portfolio/page.tsx` -> `GET /api/financial-health` -> `FinancialHealthService` -> `AIProvider`

`FinancialHealthService` creates a `FinancialSnapshot` from the verified `PortfolioSummary`. `AI_PROVIDER=mock` uses a deterministic local explanation; `AI_PROVIDER=groq` sends the snapshot to Groq through `GroqAIProvider`. The API key is used only on the server.

### Files added in Phase 1

- `domain/portfolio.ts`: domain types and pure portfolio calculations.
- `infrastructure/market-data/mock-market-data-provider.ts`: provider interface and deterministic demo data.
- `application/portfolio-service.ts`: application use case that coordinates provider and domain calculation.
- `app/api/portfolio/route.ts`: thin HTTP adapter for portfolio summary data.
- `app/portfolio/page.tsx`: interactive portfolio presentation route with add and drop controls.
- `infrastructure/ai/ai-provider.ts`: AI provider contract and financial insight types.
- `infrastructure/ai/mock-ai-provider.ts`: deterministic provider used for local development and demos.
- `infrastructure/ai/groq-ai-provider.ts`: real Groq adapter using the OpenAI-compatible API and JSON response validation.
- `application/financial-health-service.ts`: creates the structured snapshot and delegates language generation.
- `app/api/financial-health/route.ts`: thin API adapter for the financial-health insight.

## Architecture rules

- Keep presentation, application, domain, and infrastructure responsibilities separate.
- Use Strategy Pattern for interchangeable risk detectors.
- Use Repository Pattern when persistence-backed portfolio data is introduced.
- Put market APIs behind `MarketDataProvider`; adding a provider should not change portfolio calculations.
- Put AI vendors behind an `AIProvider`; the financial domain must not depend on OpenAI or another vendor.
- Keep business calculations out of React components and route handlers.
- Return evidence with every risk finding: metric, observed value, threshold, and affected holdings.
- Never present unsupported buy/sell predictions as facts or advice.
- Do not silently swallow errors in new modules; return meaningful status and user-facing states.

## Roadmap

### Phase 1: Foundation and data model

- [x] Add typed investment and portfolio summary domain models.
- [x] Add deterministic portfolio calculations.
- [x] Add mock market-data adapter.
- [x] Add portfolio route, dashboard, and add/drop controls.
- [ ] Add persisted `Asset`, `Investment`, `Portfolio`, and `PortfolioSnapshot` models.
- [ ] Extract expense business logic from the client page.

### Phase 2: Portfolio intelligence

- [ ] Add manual investment create/update/delete flow.
- [ ] Add portfolio snapshots and historical performance chart.
- [ ] Add real market-data adapter without changing the domain API.
- [ ] Add import validation and a clear data freshness timestamp.

### Phase 3: Risk detection

Introduce this contract:

```ts
interface RiskDetectionStrategy {
  evaluate(portfolio: PortfolioSummary): RiskFinding[];
}
```

Initial strategies should be independent classes: concentration, sector concentration, single-asset exposure, drawdown, volatility, correlation, and diversification. `RiskEngine` should compose strategies rather than grow a conditional chain.

### Phase 4: Financial Health Agent

- [x] Define `AIProvider` and `FinancialSnapshot` contracts.
- [x] Add deterministic mock financial-health insight generation.
- [x] Display evidence, drivers, considerations, and disclaimer in the portfolio UI.
- [x] Add configurable Groq provider behind `AIProvider`.
- [ ] Add deterministic risk findings and savings/expense data to `FinancialSnapshot`.
- [x] Add a real LLM adapter behind `AIProvider`.
- [ ] Add structured-output validation, timeout handling, and provider observability.
- [ ] Build `DataCollector`, `ChangeDetector`, `RiskPrioritizer`, `InsightGenerator`, and `RecommendationGenerator` as separate responsibilities.

### Phase 5: Integration and polish

Unify expenses, portfolio, risk, and financial health on the home dashboard. Add evaluation fixtures, loading/error states, security review, deployment configuration, and end-to-end coverage.

## Interview questions and answers

### Why integer paise instead of floating-point rupees?

Binary floating point cannot exactly represent many decimal fractions. Integer paise makes addition and comparison predictable. Conversion to rupees happens only at the presentation boundary.

### Why is the portfolio calculation in `domain/portfolio.ts`?

It is a pure business rule with no framework or I/O dependency. That makes it easy to unit test and reuse from an API, a page, a job, or an agent tool.

### Why use a provider interface for market data?

The application can use deterministic mock data during development and switch to an external provider later. Portfolio logic depends on the contract, not on a vendor SDK, rate limit, or response shape.

### Where is the Strategy Pattern useful?

Each risk detector has a different algorithm but the same `evaluate` contract. Adding liquidity risk should mean adding a strategy and registering it, rather than editing a large `if/else` method.

### Why should the LLM not calculate risk scores?

Metrics such as allocation, return, drawdown, and volatility are deterministic. Keeping them in code makes results reproducible, auditable, and testable. The LLM can explain evidence that the application already computed.

### Where is AI integrated right now?

The integration starts in `infrastructure/ai/`. `AIProvider` is the adapter contract, `MockAIProvider` is the deterministic implementation, and `GroqAIProvider` is the real Groq implementation. `FinancialHealthService` is the application boundary. The portfolio page calls `/api/financial-health`, which supplies a verified portfolio summary to the selected provider. Replacing the provider requires configuration or a new adapter, not a rewrite of the domain or UI.

### Why start with a mock AI provider?

It makes the demo deterministic, avoids exposing API keys, and lets the architecture and UI be tested before provider availability, cost, latency, and output validation are solved. Groq is now available for real explanations, while the mock remains useful for tests and offline demos.

### How do I enable Groq locally?

Copy `.env.example` to `.env.local`, set `AI_PROVIDER=groq`, add the Groq key as `GROQ_API_KEY`, and choose a supported model through `GROQ_MODEL`. Restart the dev server after changing environment variables. Never expose `GROQ_API_KEY` in client code or use a `NEXT_PUBLIC_` prefix.

```env
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
```

The provider sends only the structured `FinancialSnapshot`, requests JSON, and validates the returned shape before the API returns it. Groq requests have a 30-second timeout and one retry. If Groq is temporarily unavailable, the API returns a deterministic mock insight from the same snapshot instead of failing the whole portfolio page.

### What is the main current limitation?

Portfolio data is synthetic and held in memory by the mock provider. The UI supports adding and dropping holdings, but changes are lost when the server restarts. It is intentionally behind a provider so durable persistence and a real market-data adapter can be added without rewriting the domain or UI contract.

### How do add and drop work today?

The portfolio form sends `POST /api/portfolio` with a validated holding. The route delegates to `PortfolioService`, which delegates to `MarketDataProvider`, then recalculates the complete summary. The Drop button sends `DELETE /api/portfolio?email=...&id=...` and follows the same recalculation path. Returning the full summary after each mutation keeps totals and allocations consistent.

### What would you test first?

Test zero holdings, zero invested amount, negative P&L, mixed asset types, allocation totals, and a known fixture where each holding's value and weight can be calculated by hand. Then add route tests for missing email and provider failures.

## Interview Revision Plan

### 60-second project explanation

FenSpend is a personal AI-supported finance platform. It started as an expense tracker and now combines spending data with portfolio analytics. The application calculates portfolio metrics deterministically, detects or will detect measurable risks through independent strategies, and uses Groq only to explain verified financial snapshots. The main design goal is to keep financial truth in the application and keep the AI provider replaceable.

### Architecture walkthrough

1. Start at `app/portfolio/page.tsx`: the UI requests summaries and submits add/drop actions.
2. Move to `app/api/portfolio/route.ts`: the route validates HTTP input and delegates to the application service.
3. Explain `application/portfolio-service.ts`: it coordinates the provider and domain calculation.
4. Explain `domain/portfolio.ts`: it calculates invested value, current value, P&L, returns, weights, and allocations using integer paise.
5. Explain `infrastructure/market-data/`: the provider interface allows mock data to be replaced by a real market-data adapter.
6. Explain `app/api/financial-health/route.ts`: it obtains the verified summary and delegates insight generation.
7. Explain `infrastructure/ai/`: `AIProvider` supports both deterministic mock output and the Groq adapter.

### Topics to revise before an interview

- Next.js App Router, route handlers, server/client component boundaries, and environment variables.
- React state and effects used to load user-scoped portfolio data.
- Supabase access patterns, Row Level Security, and why the current email login is demo-level rather than production authentication.
- Integer money arithmetic and why floating-point values are unsafe for financial totals.
- Dependency inversion, Adapter Pattern, Repository Pattern, and Strategy Pattern.
- JSON validation, timeout, retry, fallback, and error handling for external AI calls.
- Multi-tenant data isolation and why identity must come from verified server authentication in production.
- Testing pure domain calculations separately from API routes and external providers.

### Questions to practice answering

**Why is the AI not calculating portfolio returns?**

Returns are deterministic and should be reproducible and auditable. Groq receives the calculated snapshot and explains it; it does not own financial truth.

**What happens when Groq is unavailable?**

The provider has a bounded timeout and retry. The API falls back to a deterministic mock insight built from the same verified snapshot, so the user does not see fabricated data or an unexplained blank state.

**Is the current authentication production-ready?**

No. The current demo stores an email in localStorage and sends it to the API. A production version should use Supabase Auth, derive identity from a verified session on the server, enforce RLS, and rate-limit AI requests.

**How would you add a new risk detector?**

Create a class implementing `RiskDetectionStrategy`, write tests for its threshold and evidence, then register it with the engine. Existing detectors and portfolio calculations do not need to change.

**What would you build next?**

Persist investments, add portfolio snapshots and historical prices, implement risk strategies, include expense and savings data in `FinancialSnapshot`, and add route/provider tests.

### Honest limitations to mention

- Portfolio data is synthetic and currently held in memory.
- The current login is a demo identity mechanism, not verified authentication.
- Risk detection strategies are planned but not implemented yet.
- The AI fallback is intentionally deterministic when Groq is unavailable.
- End-to-end and provider contract tests are still needed.

## Run and validate

From `fenspend/`:

```bash
npm install
npm run lint
npm run build
npm run dev
```

Open `/` for expenses and `/portfolio` for the synthetic portfolio dashboard. Never commit secrets from `.env` files.
