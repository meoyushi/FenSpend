"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Expense {
  id: number;
  requestId: string;
  userEmail: string;
  amount_cents: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Other",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍕",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Bills: "📄",
  Health: "💊",
  Education: "📚",
  Other: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f87171",
  Transport: "#60a5fa",
  Shopping: "#fbbf24",
  Entertainment: "#a78bfa",
  Bills: "#34d399",
  Health: "#f472b6",
  Education: "#38bdf8",
  Other: "#94a3b8",
};

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  Food: ["Groceries", "Restaurant", "Coffee", "Snacks", "Swiggy/Zomato"],
  Transport: ["Uber/Ola", "Fuel", "Metro", "Bus", "Parking"],
  Shopping: ["Clothes", "Electronics", "Amazon", "Gifts", "Home Decor"],
  Entertainment: ["Movies", "Netflix", "Games", "Concert", "Spotify"],
  Bills: ["Rent", "Electricity", "WiFi", "Phone", "Insurance"],
  Health: ["Medicine", "Doctor", "Gym", "Lab Tests", "Supplements"],
  Education: ["Books", "Course", "Stationery", "Tuition", "Workshop"],
  Other: ["Donation", "Misc", "Subscription", "Repairs", "Laundry"],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Pie Chart (SVG)                                                   */
/* ------------------------------------------------------------------ */

function PieChart({ expenses }: { expenses: Expense[] }) {
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount_cents;
  });

  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const grandTotal = entries.reduce((s, [, v]) => s + v, 0);

  if (grandTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted">
        <span className="text-4xl mb-2">📊</span>
        <p className="text-sm">No data to chart yet</p>
        <p className="text-xs text-muted/60 mt-1">Add expenses to see your breakdown</p>
      </div>
    );
  }

  // Build SVG arcs
  const cx = 80, cy = 80, r = 70;
  let cumAngle = -90; // start from top
  const slices = entries.map(([cat, val]) => {
    const pct = val / grandTotal;
    const angle = pct * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const d = entries.length === 1
      ? `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.01},${cy - r} Z`
      : `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

    return { cat, val, pct, d, color: CATEGORY_COLORS[cat] || "#94a3b8" };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-40 h-40 drop-shadow-lg">
        {slices.map((s, i) => (
          <path
            key={s.cat}
            d={s.d}
            fill={s.color}
            className="transition-all duration-300 hover:opacity-80"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <title>{s.cat}: {(s.pct * 100).toFixed(1)}%</title>
          </path>
        ))}
        {/* Center hole for donut */}
        <circle cx={cx} cy={cy} r={35} className="fill-card" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground text-[10px] font-bold">
          {formatCurrency(grandTotal)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted text-[6px]">
          total
        </text>
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
        {slices.map((s) => (
          <div key={s.cat} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted truncate">{s.cat}</span>
            <span className="ml-auto font-mono text-foreground/80">
              {(s.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loader                                                   */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full rounded bg-border" />
        </td>
      ))}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Login Card                                                        */
/* ------------------------------------------------------------------ */

function LoginCard({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    onLogin(trimmed);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40"
      >
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 animate-pulse-glow overflow-hidden">
            <Image
              src="/logo.png"
              alt="FenSpend Logo"
              width={64}
              height={64}
              className="rounded-xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            FenSpend
          </h1>
          <p className="mt-2 text-sm text-muted">
            Track every rupee. Stay in control.
          </p>
          <p className="mt-1 text-xs text-accent/70 italic">
            Categorize · Visualize · Optimize
          </p>
        </div>

        {/* Email input */}
        <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="you@example.com"
          className="mb-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {error && (
          <p className="mb-3 text-xs text-danger animate-slide-down">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
        >
          Continue →
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

function Dashboard({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  /* ---- state ---- */
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [successMsg, setSuccessMsg] = useState("");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  /* ---- fetch expenses ---- */
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data: Expense[] = await res.json();
        setExpenses(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  /* ---- submit expense ---- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setPosting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: generateRequestId(),
          amount: Number(amount),
          category,
          description: description.trim(),
          date,
          email,
        }),
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        setDate(new Date().toISOString().slice(0, 10));
        setSuccessMsg("Expense added!");
        setTimeout(() => setSuccessMsg(""), 2500);
        await fetchExpenses();
      }
    } catch {
      /* silent */
    } finally {
      setPosting(false);
    }
  };

  /* ---- derived ---- */
  const filtered = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;

  const visibleExpenses = [...filtered].sort((a, b) =>
    sortOrder === "newest"
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const total = visibleExpenses.reduce(
    (sum, e) => sum + e.amount_cents,
    0
  );

  const handleDelete = async (id: number) => {
    const ok = confirm("Delete this expense?");
    if (!ok) return;

    await fetch(`/api/expenses?id=${id}`, {
      method: "DELETE",
    });

    fetchExpenses();
  };

  /* ---- render ---- */
  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FenSpend" width={28} height={28} className="rounded-md" />
            <h1 className="text-lg font-bold tracking-tight">FenSpend</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{email}</span>
            <button
              id="logout-btn"
              onClick={onLogout}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-danger hover:text-danger hover:bg-danger/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {/* ---- Summary bar ---- */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="Total Expenses" value={expenses.length.toString()} icon="📊" />
          <SummaryCard label="Visible Expenses" value={filtered.length.toString()} icon="👁️" />
          <SummaryCard
            label="Total Amount"
            value={formatCurrency(total)}
            icon="💰"
            highlight
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ---- Add Expense Form ---- */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                Add Expense
              </h2>

              {successMsg && (
                <div className="mb-4 animate-slide-down rounded-xl bg-success/10 border border-success/20 px-4 py-2.5 text-xs font-medium text-success">
                  ✓ {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount */}
                <div>
                  <label htmlFor="expense-amount" className="mb-1 block text-xs text-muted">
                    Amount (₹)
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="expense-category" className="mb-1 block text-xs text-muted">
                    Category
                  </label>
                  <select
                    id="expense-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_ICONS[c]} {c}
                      </option>
                    ))}
                  </select>
                  {/* Suggestion chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(CATEGORY_SUGGESTIONS[category] || []).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDescription(s)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-all ${description === s
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted hover:border-accent/40 hover:text-accent/80"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted/50 italic">
                    Tap a suggestion or type your own below
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="expense-description" className="mb-1 block text-xs text-muted">
                    Description
                  </label>
                  <input
                    id="expense-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was it for?"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="expense-date" className="mb-1 block text-xs text-muted">
                    Date
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {/* Submit */}
                <button
                  id="submit-expense-btn"
                  type="submit"
                  disabled={posting}
                  className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-background transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {posting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> Adding…
                    </span>
                  ) : (
                    "Add Expense"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ---- Expenses List ---- */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              {/* Header + Filter */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Expenses
                </h2>

                <div className="flex gap-2">
                  <select
                    id="filter-category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_ICONS[c]} {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-xs uppercase tracking-wider text-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border stagger">
                    {loading ? (
                      <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                      </>
                    ) : visibleExpenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-muted"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-3xl">🧾</span>
                            <span className="text-sm">No expenses yet</span>
                            <span className="text-xs text-muted/60">
                              Add one using the form
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleExpenses.map((exp) => (
                        <tr
                          key={exp.id}
                          className="animate-fade-in transition-colors hover:bg-card-hover"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted">
                            {formatDate(exp.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-bg px-2.5 py-1 text-xs font-medium text-accent">
                              {CATEGORY_ICONS[exp.category] ?? "📦"}{" "}
                              {exp.category}
                            </span>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-foreground/80">
                            {exp.description || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-foreground">
                            {formatCurrency(exp.amount_cents)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger/10"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Footer total */}
                  {!loading && visibleExpenses.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border bg-accent-bg">
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-accent"
                        >
                          Total ({visibleExpenses.length} expense{visibleExpenses.length !== 1 ? "s" : ""})
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-accent">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* ---- Pie Chart ---- */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted">
                  Spending Breakdown
                </h2>
                <p className="mb-4 text-xs text-muted/60">
                  See where your money goes — categorize to conquer.
                </p>
                <PieChart expenses={expenses} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small components                                                  */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${highlight
        ? "border-accent/30 bg-accent-bg"
        : "border-border bg-card hover:border-border-hover"
        }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p
            className={`text-lg font-bold tracking-tight ${highlight ? "text-accent" : "text-foreground"
              }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Root Page                                                         */
/* ------------------------------------------------------------------ */

const LS_KEY = "fenspend_email";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  /* Read localStorage after mount */
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setEmail(stored);
    setReady(true);
  }, []);

  const handleLogin = (em: string) => {
    localStorage.setItem(LS_KEY, em);
    setEmail(em);
  };

  const handleLogout = () => {
    localStorage.removeItem(LS_KEY);
    setEmail(null);
  };

  /* Avoid flash while reading localStorage */
  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!email) {
    return <LoginCard onLogin={handleLogin} />;
  }

  return <Dashboard email={email} onLogout={handleLogout} />;
}
