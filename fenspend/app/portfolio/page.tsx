"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { AssetType, Investment, PortfolioSummary } from "@/domain/portfolio";
import type { FinancialHealthInsight } from "@/infrastructure/ai/ai-provider";

function formatCurrency(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function labelForAssetType(value: string): string {
  return value.replace("MUTUAL_FUND", "MUTUAL FUND");
}

const LS_KEY = "fenspend_email";

export default function PortfolioPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [insight, setInsight] = useState<FinancialHealthInsight | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem(LS_KEY);
    if (storedEmail) {
      Promise.resolve().then(() => setUserEmail(storedEmail));
    }
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    let active = true;
    fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load portfolio");
        return response.json();
      })
      .then((data: PortfolioSummary) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setError("Could not load portfolio data.");
      });

    return () => {
      active = false;
    };
  }, [userEmail]);

  const fetchInsight = async () => {
    if (!userEmail) return;
    const response = await fetch(`/api/financial-health?email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error("Could not load insight");
    setInsight(await response.json());
  };

  useEffect(() => {
    if (!userEmail) return;

    fetch(`/api/financial-health?email=${encodeURIComponent(userEmail)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load insight");
        return response.json();
      })
      .then((data: FinancialHealthInsight) => setInsight(data))
      .catch(() => setError("Could not load the financial health insight."));
  }, [userEmail]);

  const addHolding = async (investment: Omit<Investment, "id">) => {
    if (!userEmail) return;
    setError("");
    const response = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, investment }),
    });
    if (!response.ok) {
      setError("Could not add holding. Check the values and try again.");
      return;
    }
    setSummary(await response.json());
    await fetchInsight();
  };

  const dropHolding = async (id: string) => {
    if (!userEmail) return;
    setError("");
    const response = await fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Could not drop holding.");
      return;
    }
    setSummary(await response.json());
    await fetchInsight();
  };

  if (!userEmail) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted">
        <p>Please log in before opening your portfolio.</p>
        <Link href="/" className="text-accent hover:text-accent-hover">Back to login</Link>
      </main>
    );
  }

  if (!summary) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-muted">Loading portfolio...</main>;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-accent hover:text-accent-hover">
              ← Back to expenses
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Phase 1 foundation
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Portfolio intelligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              A deterministic view of holdings, performance, and allocation. This first slice uses clearly labelled synthetic data.
            </p>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent-bg px-3 py-1.5 text-xs font-medium text-accent">
            Mock market data
          </span>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio summary">
          <SummaryCard label="Current value" value={formatCurrency(summary.currentValuePaise)} />
          <SummaryCard label="Invested" value={formatCurrency(summary.investedPaise)} />
          <SummaryCard
            label="Profit / loss"
            value={formatCurrency(summary.pnlPaise)}
            tone={summary.pnlPaise >= 0 ? "positive" : "negative"}
          />
          <SummaryCard
            label="Overall return"
            value={formatPercentage(summary.returnPercentage)}
            tone={summary.returnPercentage >= 0 ? "positive" : "negative"}
          />
        </section>

        {insight && <InsightPanel insight={insight} />}

        <section className="grid gap-6 lg:grid-cols-2">
          <AllocationPanel title="Asset allocation" entries={summary.assetAllocation} />
          <AllocationPanel title="Sector allocation" entries={summary.sectorAllocation} />
        </section>

        <AddHoldingForm onAdd={addHolding} />

        {error && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-background/50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Asset</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Units</th>
                  <th className="px-5 py-3 font-medium text-right">Value</th>
                  <th className="px-5 py-3 font-medium text-right">P&amp;L</th>
                  <th className="px-5 py-3 font-medium text-right">Weight</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.holdings.map((holding) => (
                  <tr key={holding.id} className="transition-colors hover:bg-card-hover">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{holding.symbol}</p>
                      <p className="mt-0.5 max-w-[230px] truncate text-xs text-muted">{holding.name}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">{labelForAssetType(holding.assetType)}</td>
                    <td className="px-5 py-4 text-right font-mono text-foreground/80">{holding.units}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold">{formatCurrency(holding.currentValuePaise)}</td>
                    <td className={`px-5 py-4 text-right font-mono font-semibold ${holding.pnlPaise >= 0 ? "text-success" : "text-danger"}`}>
                      {formatPercentage(holding.returnPercentage)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-foreground/80">{holding.weightPercentage.toFixed(1)}%</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => dropHolding(holding.id)}
                        className="rounded-lg border border-danger/30 px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        Drop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function InsightPanel({ insight }: { insight: FinancialHealthInsight }) {
  return (
    <section className="mb-6 rounded-2xl border border-accent/30 bg-accent-bg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Financial health agent</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">{insight.headline}</h2>
        </div>
        <span className="rounded-full border border-accent/30 px-2.5 py-1 text-[11px] font-medium text-accent">Evidence-based summary</span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/80">{insight.summary}</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <InsightList title="What drove this" items={insight.drivers} />
        <InsightList title="What to consider" items={insight.considerations} />
      </div>
      <p className="mt-5 border-t border-accent/20 pt-3 text-xs text-muted">{insight.disclaimer}</p>
    </section>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-foreground/80">
        {items.map((item) => <li key={item} className="flex gap-2"><span className="text-accent">•</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}

function AddHoldingForm({
  onAdd,
}: {
  onAdd: (investment: Omit<Investment, "id">) => Promise<void>;
}) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("STOCK");
  const [sector, setSector] = useState("");
  const [units, setUnits] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    await onAdd({
      symbol,
      name,
      assetType,
      sector,
      units: Number(units),
      averageCostPaise: Math.round(Number(averageCost) * 100),
      currentPricePaise: Math.round(Number(currentPrice) * 100),
    });
    setSaving(false);
    setSymbol("");
    setName("");
    setSector("");
    setUnits("");
    setAverageCost("");
    setCurrentPrice("");
  };

  const inputClass = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Add holding</h2>
        <p className="mt-1 text-xs text-muted/70">Enter prices in rupees. The service stores them as paise.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <input aria-label="Symbol" required placeholder="Symbol (e.g. RELIANCE)" value={symbol} onChange={(event) => setSymbol(event.target.value)} className={inputClass} />
        <input aria-label="Name" required placeholder="Asset name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        <select aria-label="Asset type" value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)} className={inputClass}>
          <option value="STOCK">Stock</option>
          <option value="MUTUAL_FUND">Mutual fund</option>
          <option value="ETF">ETF</option>
          <option value="BOND">Bond</option>
        </select>
        <input aria-label="Sector" required placeholder="Sector" value={sector} onChange={(event) => setSector(event.target.value)} className={inputClass} />
        <input aria-label="Units" required min="0.01" step="0.01" type="number" placeholder="Units" value={units} onChange={(event) => setUnits(event.target.value)} className={inputClass} />
        <input aria-label="Average cost" required min="0.01" step="0.01" type="number" placeholder="Average cost (₹)" value={averageCost} onChange={(event) => setAverageCost(event.target.value)} className={inputClass} />
        <input aria-label="Current price" required min="0.01" step="0.01" type="number" placeholder="Current price (₹)" value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} className={inputClass} />
        <button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Adding..." : "Add holding"}
        </button>
      </form>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${tone === "positive" ? "text-success" : tone === "negative" ? "text-danger" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function AllocationPanel({
  title,
  entries,
}: {
  title: string;
  entries: { label: string; percentage: number }[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-foreground/85">{entry.label}</span>
              <span className="font-mono text-muted">{entry.percentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent" style={{ width: `${entry.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
