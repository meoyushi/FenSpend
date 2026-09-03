# FenSpend AI Financial Health Platform

This document is the complete product and engineering master plan for your FenSpend personal project. It explains how the current implementation grows toward the final platform.

## Product Definition

> Build FenSpend, an AI-powered personal financial intelligence platform.
>
> FenSpend currently functions as an expense tracker. Extend it into a unified financial intelligence application without breaking the existing expense-tracking functionality.

The platform has three major capabilities:

### 1. AI Portfolio Intelligence

- Maintain or import investments across stocks, mutual funds, ETFs, bonds, and other supported assets.
- Show portfolio value, invested amount, absolute and percentage returns, allocation, historical performance, and asset-level performance.
- Provide explainable insights about what is driving portfolio performance.

### 2. Portfolio Risk Detector

Detect measurable portfolio risks such as:

- Concentration risk
- Sector concentration
- Excessive single-asset exposure
- Drawdown
- Volatility changes
- Lack of diversification
- Correlated holdings

Every finding must contain the metric and evidence that triggered it. The system must present risks as analytical insights and possible considerations, not guaranteed investment advice. It must not make unsupported buy/sell predictions.

### 3. Financial Health Agent

Analyze expenses, income, savings behavior, investment behavior, portfolio performance, and portfolio risk together. The agent should:

- Generate an explainable financial-health summary.
- Explain what changed and why it matters.
- Suggest what the user could consider doing.
- Never fabricate financial data.

## Core Architecture Requirement

Build the application using clean, modular, extensible code. Follow SOLID principles and low-level design practices. Use the Strategy Pattern wherever multiple interchangeable calculation, detection, or recommendation strategies exist.

Keep business logic separate from:

- UI
- Database
- API clients
- Market-data integrations
- AI and LLM integrations

The system must allow new risk detectors, financial agents, asset classes, market-data providers, and AI providers to be added without rewriting existing modules.

## Production Phases

The ordering is intentional: do not start with the LLM agent. First create trustworthy financial data and deterministic analytics; then allow AI to reason over those results.

### Phase 1: Foundation and Data Model

**Goal:** Understand the existing FenSpend application and establish a clean architecture.

**Tasks:**

- Audit the existing frontend, API routes, database schema, authentication, reusable components, state management, charts, validation, and error handling.
- Preserve working expense-tracking functionality. Refactor only where necessary.
- Establish domain entities:

```text
User
Account
Transaction
Investment
Portfolio
PortfolioSnapshot
Asset
MarketPrice
RiskFinding
FinancialInsight
AgentRun
```

- Separate Presentation, Application, Domain, and Infrastructure layers.
- Define repository interfaces for investments, portfolios, transactions, market data, and risk findings.
- Start with synthetic or manual investment data so the rest of the platform can be built deterministically.

**Current status:** typed portfolio models, deterministic calculations, mock market-data provider, portfolio page, add/drop controls, and provider-agnostic AI infrastructure are implemented. Durable investment persistence remains planned.

**Completion criteria:** the user can open FenSpend and see Expenses, Transactions, and Portfolio. Portfolio is initially populated with synthetic/manual data. No AI is required to calculate financial metrics.

### Phase 2: Portfolio Intelligence

**Goal:** Build the complete portfolio experience.

The dashboard should show:

```text
Current Value | Invested | P&L | Return

Portfolio Performance
Historical chart

Asset Allocation | Sector Allocation

Asset | Units | Average Cost | Current Price | P&L | Weight
```

The portfolio module should support:

- Manual investment creation, editing, and deletion.
- Import validation.
- Historical snapshots and performance.
- Asset-level performance.
- A market-data abstraction so mock and external providers are interchangeable.
- A clear data freshness timestamp.

The UI must not be hard-wired to a single market API.

```text
MarketDataProvider
  ├── MockMarketDataProvider
  └── ExternalMarketDataProvider
```

### Phase 3: Portfolio Risk Detection Engine

**Goal:** Build deterministic, measurable, explainable portfolio-risk analysis.

Use independent strategies rather than a large conditional function:

```text
RiskDetectionStrategy
  ├── ConcentrationRiskStrategy
  ├── SectorConcentrationStrategy
  ├── SingleAssetExposureStrategy
  ├── DrawdownRiskStrategy
  ├── VolatilityRiskStrategy
  ├── CorrelationRiskStrategy
  └── DiversificationRiskStrategy
```

Contract:

```ts
interface RiskDetectionStrategy {
  evaluate(portfolio: PortfolioSummary): RiskFinding[];
}
```

The engine composes strategies:

```ts
const strategies = [
  new ConcentrationRiskStrategy(),
  new SectorConcentrationStrategy(),
  new VolatilityRiskStrategy(),
  new DrawdownRiskStrategy(),
  new CorrelationRiskStrategy(),
];

const findings = strategies.flatMap((strategy) => strategy.evaluate(portfolio));
```

Adding liquidity, ESG, or currency risk should require adding a strategy and registering it, not modifying a giant conditional method.

Example finding:

```text
HIGH
Technology sector concentration

Technology represents 46.8% of equity exposure.
Threshold: 40%

Evidence:
TCS, Infosys, Technology mutual fund, IT ETF

Impact:
A sector-level downturn could materially affect portfolio value.
```

Risk scoring must be transparent and deterministic:

```text
Portfolio Risk Score: 64 / 100

Concentration: 72
Diversification: 54
Volatility: 61
Drawdown: 48
Correlation: 69
```

The LLM explains the score. It does not invent the score.

### Phase 4: Financial Health Agent

**Goal:** Add AI reasoning and orchestration only after financial data and risk analysis are trustworthy.

The agent consumes a structured snapshot, not a raw database dump:

```text
FinancialSnapshot
├── income
├── expenses
├── savings_rate
├── investment_contribution
├── portfolio_value
├── portfolio_return
├── portfolio_risk_score
├── risk_findings
└── recent_changes
```

Recommended responsibilities:

```text
FinancialHealthAgent
  ├── DataCollector
  ├── ChangeDetector
  ├── RiskPrioritizer
  ├── InsightGenerator
  └── RecommendationGenerator
```

The LLM belongs primarily around `InsightGenerator` and `RecommendationGenerator`. It should explain verified structured data and label recommendations as considerations, never guaranteed advice.

Explicit agent tools may include:

```text
get_financial_snapshot()
get_portfolio_summary()
get_risk_findings()
get_spending_trends()
get_investment_history()
get_recent_changes()
compare_portfolio_periods()
calculate_allocation()
explain_risk()
```

Current AI flow:

```text
Portfolio data
  ↓
FinancialSnapshot
  ↓
FinancialHealthService
  ↓
AIProvider
  ├── MockAIProvider
  └── GroqAIProvider
  ↓
Validated FinancialHealthInsight
  ↓
Portfolio UI
```

The current Groq adapter uses Groq's OpenAI-compatible API, requests JSON, validates the response shape, and keeps the API key server-side.

### Phase 5: Integration, Evaluation, and Polish

**Goal:** Turn the separate capabilities into a reliable hackathon-ready product.

The home dashboard should eventually show:

```text
Your Financial Health

Financial Health Score: 76 / 100
Status: Stable

Expenses: ₹48,200  ↑ 12%
Investments: ₹25,000  → stable
Portfolio: ₹8.42L  ↑ 4.3%
Savings Rate: 28%  ↓ 3%

AI Summary
Your portfolio performed well this month, but financial health declined because
spending increased and the portfolio became more concentrated.

Top alerts
High technology concentration
Dining spending +38%
Investment contribution consistent
Overall portfolio return positive
```

Add evaluation fixtures, end-to-end coverage, loading and error states, security review, deployment configuration, observability, and clear data freshness indicators.

## Layered Architecture

```text
Presentation
    ↓
Application
    ↓
Domain
    ↓
Infrastructure
```

### Presentation

Next.js App Router pages, React components, forms, charts, loading states, and user interactions. Components consume application/API results and do not know database or vendor details.

### Application

Use cases and orchestration such as `GetPortfolioSummary`, `AnalyzePortfolioRisk`, `GetFinancialHealth`, and `GenerateFinancialInsight`. This layer coordinates domain services and interfaces.

### Domain

Entities, value objects, calculations, risk strategies, scoring rules, and repository/provider interfaces. The domain must not import Next.js, React, Supabase, Prisma, OpenAI, Grok, or vendor SDKs.

### Infrastructure

Supabase, Prisma adapters, market-data providers, AI providers, logging, configuration, and external API clients.

Suggested structure:

```text
fenspend/
├── app/
│   ├── api/
│   │   ├── expenses/
│   │   ├── portfolio/
│   │   └── financial-health/
│   ├── portfolio/
│   └── page.tsx
├── application/
│   ├── portfolio-service.ts
│   └── financial-health-service.ts
├── domain/
│   └── portfolio.ts
├── infrastructure/
│   ├── market-data/
│   │   └── mock-market-data-provider.ts
│   └── ai/
│       ├── ai-provider.ts
│       ├── mock-ai-provider.ts
│       └── groq-ai-provider.ts
├── prisma/
├── public/
└── docs/
```

A larger future structure may split `domain/entities`, `domain/strategies/risk`, `domain/repositories`, `application/use-cases`, `infrastructure/database`, `infrastructure/market-data`, and `infrastructure/ai` into separate modules.

## Current Technology

| Concern | Technology | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | Full-stack React application with server routes |
| Language | TypeScript strict mode | Typed contracts and safer refactoring |
| UI | React 19 | Interactive client components |
| Styling | Tailwind CSS 4 | Existing utility-based styling system |
| Expense database | Supabase Postgres | Existing expense persistence and API integration |
| Portfolio demo data | Mock provider | Deterministic development and hackathon demos |
| Portfolio calculations | Pure TypeScript domain functions | Testable, framework-independent financial rules |
| AI abstraction | `AIProvider` | Provider independence and dependency inversion |
| Real LLM | Groq via OpenAI-compatible SDK | Server-side explainable insight generation |
| Legacy data layer | Prisma and SQLite | Existing legacy files; not currently active for expenses |
| Deployment | Vercel | Natural Next.js deployment target |

## LLD Rules

1. Follow SOLID principles.
2. Use Strategy Pattern for interchangeable risk-detection algorithms.
3. Use Repository Pattern for persistence.
4. Use Adapter interfaces for external market-data providers and AI providers.
5. Keep domain logic independent of frameworks and databases.
6. Keep UI components unaware of database implementation details.
7. Never implement business calculations directly inside UI components.
8. AI explanations must consume verified structured data from domain/application services.
9. Do not let an LLM calculate or invent metrics that can be deterministically calculated.
10. All financial calculations must have unit tests.
11. Avoid giant service classes and giant components.
12. Each class or module should have one clear responsibility.
13. Prefer dependency injection over hard-coded dependencies.
14. Put external APIs behind interfaces and adapters.
15. Adding a new risk strategy should require a new strategy class rather than modifying a giant conditional function.
16. Adding a market-data provider should not require modifying portfolio business logic.
17. Adding an AI provider should not require modifying the financial-health domain.
18. Keep presentation, application, domain, and infrastructure concerns separated.
19. Provide meaningful error handling and loading states.
20. Never silently swallow errors.

## What Not To Do

- Do not rewrite the whole existing FenSpend application from scratch.
- Do not replace working functionality unnecessarily.
- Do not put all logic into one giant file or component.
- Do not use an LLM for deterministic calculations.
- Do not create fake AI metrics without an underlying calculation.
- Do not hard-code portfolio values into UI components.
- Do not couple portfolio logic directly to one market-data API.
- Do not couple business logic directly to Supabase.
- Do not add unnecessary microservices.
- Do not add unnecessary authentication or infrastructure complexity.
- Do not provide direct financial buy/sell instructions.
- Do not claim that an asset will rise or fall with certainty.

## Synthetic Data Decision

Synthetic investment data is appropriate for the initial hackathon build. It keeps the demonstration deterministic and avoids being blocked by market-data availability, rate limits, authentication, licensing, or provider changes.

The demo story is:

> Here is a portfolio containing multiple holdings. The deterministic engine detects measurable risks, explains the evidence, and the Financial Health Agent connects those signals with spending behavior.

The provider abstraction allows a real market-data source to be plugged in later without changing portfolio business logic.

## Interview Preparation

### What is FenSpend?

FenSpend is an AI-powered financial intelligence platform that unifies spending and investment data into an explainable view of a user's financial health. Portfolio Intelligence analyzes performance and allocation, the Portfolio Risk Engine detects measurable risk, and the Financial Health Agent explains what changed, why it matters, and what the user could consider next.

### Why not start with the LLM?

An LLM is not a reliable source of financial truth. Deterministic calculations must exist first so the system can audit, test, reproduce, and explain its results. The LLM is then used for language and reasoning over verified outputs.

### Why integer paise?

Binary floating point cannot exactly represent many decimal fractions. Integer paise makes money arithmetic predictable. Conversion to rupees occurs only at the presentation boundary.

### Why use the Strategy Pattern?

Risk detectors have different algorithms but share an evaluation contract. The Strategy Pattern makes each detector independently testable and lets the system add new risk types without editing a large conditional function.

### Why use Repository and Adapter patterns?

Repositories abstract persistence. Adapters abstract external providers. This keeps business logic independent from Supabase, market-data vendors, and AI vendors, making providers replaceable and easier to test.

### Where is AI integrated?

`GroqAIProvider` is in `infrastructure/ai/`. `FinancialHealthService` builds a `FinancialSnapshot`, selects the configured `AIProvider`, and returns a validated `FinancialHealthInsight`. The API route keeps the provider server-side and the UI only receives the final structured result.

### Why keep a mock provider after adding Grok?

The mock provider enables deterministic tests, offline development, predictable demos, and zero API cost. Groq is used for real language generation when `AI_PROVIDER=groq` is configured.

### What happens if the LLM returns bad data?

The Groq adapter requests JSON and validates the exact response shape. Empty, invalid, or malformed output causes an error. Requests have a bounded timeout and one retry; if Groq is temporarily unavailable, the API falls back to a deterministic mock insight built from the same verified snapshot instead of displaying untrusted content.

### What is the current limitation?

Portfolio holdings are synthetic and stored in memory by the mock provider. Add/drop controls work during the running process, but changes are lost when the server restarts. The next foundation step is persisted investment data.

### What would you test first?

Test zero holdings, zero invested amount, positive and negative P&L, mixed asset types, allocation totals, holding weights, invalid API input, provider failures, malformed AI JSON, and a known fixture whose results can be calculated by hand.

## Groq Configuration

Copy `.env.example` to `.env.local` and configure:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
```

Use `AI_PROVIDER=mock` for deterministic local development. Never use `NEXT_PUBLIC_` for the API key, commit secrets, or call Groq directly from browser code. Restart the dev server after changing environment variables.

## Run and Validate

From `fenspend/`:

```bash
npm install
npm run lint
npm run build
npm run dev
```

Routes currently available:

- `/` expense tracker
- `/portfolio` portfolio intelligence dashboard
- `/api/expenses` expense API
- `/api/portfolio` portfolio API
- `/api/financial-health` AI financial-health API

## Final Product Story

> FenSpend is an AI-powered financial intelligence platform that unifies spending and investment data into an explainable view of a user's financial health. Its Portfolio Intelligence module analyzes performance and allocation, its Portfolio Risk Engine detects measurable risks such as concentration and volatility, and its Financial Health Agent synthesizes these signals with spending behavior to explain what changed, why it matters, and what the user should consider next.
