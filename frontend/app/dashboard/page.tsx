"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import supabase, { supabaseConfigError } from "../../lib/supabase";

type DashboardUser = {
  id: string;
  email: string;
};

type InventoryRecord = {
  id: number;
  user_id: string;
  product: string;
  stock: number;
};

type TransactionRecord = {
  id: number;
  user_id: string;
  type: "income" | "expense";
  amount: number;
};

type DealRecord = {
  id: number;
  user_id: string;
  name: string;
  value: number;
  probability: number;
};

type AIInsights = {
  status?: "ok" | "warning" | "critical";
  insights?: Array<{
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    explanation: string;
    impact: string;
    recommendation: string;
  }>;
  summary?: string;
  metrics?: Record<string, number | string | null>;
  alerts?: string[];
  recommendations?: string[];
  predictions?: Record<string, number | string | null>;
  confidence?: string;
};

type AISimulation = {
  before?: AIInsights;
  after?: AIInsights;
  impact?: {
    metrics_change: string;
    risk_change: string;
    decision_insight: string;
  };
};

function formatMetricChange(beforeValue?: number | string | null, afterValue?: number | string | null) {
  const beforeNumber = Number(beforeValue ?? 0);
  const afterNumber = Number(afterValue ?? 0);

  if (Number.isNaN(beforeNumber) || Number.isNaN(afterNumber)) {
    return "No metrics comparison returned.";
  }

  const change = afterNumber - beforeNumber;
  const percent = beforeNumber === 0 ? null : ((change / beforeNumber) * 100).toFixed(1);
  const percentText = percent === null ? "+0.0%" : `${change >= 0 ? "+" : ""}${percent}%`;

  return `${change >= 0 ? "Increased" : "Decreased"} from ${beforeNumber.toFixed(2)} to ${afterNumber.toFixed(2)} (${change >= 0 ? "+" : ""}${change.toFixed(2)}, ${percentText})`;
}

function normalizeSimulation(raw: AISimulation | Record<string, unknown>): AISimulation {
  const before = raw.before && typeof raw.before === "object" ? normalizeAiInsights(raw.before as AIInsights | Record<string, unknown>) : undefined;
  const after = raw.after && typeof raw.after === "object" ? normalizeAiInsights(raw.after as AIInsights | Record<string, unknown>) : undefined;

  const impactCandidate = raw.impact && typeof raw.impact === "object" ? (raw.impact as Record<string, unknown>) : {};
  const beforeMetrics = before?.metrics ?? {};
  const afterMetrics = after?.metrics ?? {};

  const metricsChange = typeof impactCandidate.metrics_change === "string" && impactCandidate.metrics_change.trim().length > 0
    ? impactCandidate.metrics_change
    : `Demand ${formatMetricChange(beforeMetrics.adjusted_demand ?? beforeMetrics.predicted_demand, afterMetrics.adjusted_demand ?? afterMetrics.predicted_demand)}; stock ${formatMetricChange(beforeMetrics.stock, afterMetrics.stock)}; cash flow ${formatMetricChange(beforeMetrics.net_cash_flow ?? beforeMetrics.cash_flow, afterMetrics.net_cash_flow ?? afterMetrics.cash_flow)}.`;

  const beforeRisk = String(beforeMetrics.risk_level ?? before?.status ?? "moderate");
  const afterRisk = String(afterMetrics.risk_level ?? after?.status ?? "moderate");

  const riskChange = typeof impactCandidate.risk_change === "string" && impactCandidate.risk_change.trim().length > 0
    ? impactCandidate.risk_change
    : `Risk changed from ${beforeRisk} to ${afterRisk}.`;

  const decisionInsight = typeof impactCandidate.decision_insight === "string" && impactCandidate.decision_insight.trim().length > 0
    ? impactCandidate.decision_insight
    : "This action changes the operating outlook, but the decision strength is unclear without a complete impact summary.";

  const normalizedImpact = {
    metrics_change: metricsChange,
    risk_change: riskChange,
    decision_insight: decisionInsight,
  };

  return {
    before,
    after,
    impact: normalizedImpact,
  };
}

function normalizeAiInsights(raw: AIInsights | Record<string, unknown>): Required<Pick<AIInsights, "status" | "insights" | "summary" | "metrics">> {
  const alerts = Array.isArray(raw.alerts) ? raw.alerts : [];
  const recommendations = Array.isArray(raw.recommendations) ? raw.recommendations : [];
  const existingInsights = Array.isArray(raw.insights) ? raw.insights : [];

  const mappedInsights = existingInsights.map((insight) => {
    const current = insight as Record<string, unknown>;
    return {
      title: String(current.title ?? "Insight"),
      severity: (current.severity === "critical" || current.severity === "high" || current.severity === "medium" || current.severity === "low"
        ? current.severity
        : "medium") as "low" | "medium" | "high" | "critical",
      explanation: String(current.explanation ?? current.message ?? "No explanation returned."),
      impact: String(current.impact ?? "No impact returned."),
      recommendation: String(current.recommendation ?? current.action ?? "No recommendation returned."),
    };
  });

  const fallbackInsights = [
    ...alerts.map((alert) => ({
      title: "Alert",
      severity: "high" as const,
      explanation: String(alert),
      impact: "This signal may affect stock, cash flow, or execution risk if left unresolved.",
      recommendation: "Review this signal in the dashboard and decide whether action is needed now.",
    })),
    ...recommendations.map((recommendation) => ({
      title: "Recommendation",
      severity: "medium" as const,
      explanation: String(recommendation),
      impact: "Following this recommendation should improve the current business position.",
      recommendation: "Apply this recommendation if it matches your current plan.",
    })),
  ];

  const insights = mappedInsights.length > 0 ? mappedInsights : fallbackInsights;
  const status = raw.status === "critical" || raw.status === "warning" || raw.status === "ok" ? raw.status : "ok";
  const summary = typeof raw.summary === "string" ? raw.summary : "No summary returned by the backend.";
  const metrics = raw.metrics && typeof raw.metrics === "object" ? (raw.metrics as Record<string, number | string | null>) : ({} as Record<string, number | string | null>);

  return { status, insights, summary, metrics };
}

function metricLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data state for each table.
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);

  // Form state: Add Product.
  const [productName, setProductName] = useState("");
  const [productStock, setProductStock] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  // Form state: Add Transaction.
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [addingTransaction, setAddingTransaction] = useState(false);

  // Form state: Add Deal.
  const [dealName, setDealName] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealProbability, setDealProbability] = useState("");
  const [addingDeal, setAddingDeal] = useState(false);

  // AI insights returned by the FastAPI decision engine.
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // Scenario simulation state.
  const [simulation, setSimulation] = useState<AISimulation | null>(null);
  const [simulationType, setSimulationType] = useState<"increase_stock" | "increase_expense" | "deal_success">("increase_stock");
  const [simulating, setSimulating] = useState(false);

  // Inline edit state for the two fields we want to update.
  const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);
  const [editingInventoryStock, setEditingInventoryStock] = useState("");
  const [savingInventory, setSavingInventory] = useState(false);

  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  const [editingDealProbability, setEditingDealProbability] = useState("");
  const [savingDeal, setSavingDeal] = useState(false);

  function getAiApiBaseUrl() {
    // Use the local FastAPI server in development so the browser calls the backend code in this repo.
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return "http://127.0.0.1:10000";
    }

    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }

  async function generateAiInsights() {
    if (!supabase) {
      return;
    }

    const apiUrl = getAiApiBaseUrl();
    if (!apiUrl) {
      setError("Missing NEXT_PUBLIC_API_URL in frontend/.env.local");
      return;
    }

    setGeneratingInsights(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/ai/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventory,
          transactions,
          deals,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI insights");
      }

      const data = (await response.json()) as AIInsights;
      console.log(data);
      setAiInsights(normalizeAiInsights(data));
      setSuccess("AI insights generated successfully.");
    } catch {
      setError("Failed to fetch AI insights");
    } finally {
      setGeneratingInsights(false);
    }
  }

  async function runSimulation() {
    if (!supabase) {
      return;
    }

    const apiUrl = getAiApiBaseUrl();
    if (!apiUrl) {
      setError("Missing NEXT_PUBLIC_API_URL in frontend/.env.local");
      return;
    }

    setSimulating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/ai/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario_type: simulationType,
          inventory,
          transactions,
          deals,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run simulation");
      }

      const data = (await response.json()) as AISimulation;
      console.log(data);
      setSimulation(normalizeSimulation(data));
      setSuccess("Simulation completed successfully.");
    } catch {
      setError("Failed to run simulation");
    } finally {
      setSimulating(false);
    }
  }

  const totalProducts = inventory.length;
  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalDealValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  function renderMetricCards(metrics: Record<string, number | string | null>) {
    const entries = Object.entries(metrics);

    if (entries.length === 0) {
      return <p className="text-sm text-slate-500">No metrics returned.</p>;
    }

    return entries.map(([key, value]) => (
      <div key={key} className="rounded-xl bg-white px-3 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metricLabel(key)}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{String(value ?? "-")}</p>
      </div>
    ));
  }

  const fetchData = useCallback(async (currentUserId: string) => {
    if (!supabase) {
      return;
    }

    setFetchingData(true);

    const [inventoryResult, transactionsResult, dealsResult] = await Promise.all([
      supabase.from("inventory").select("*").eq("user_id", currentUserId).order("id", { ascending: false }),
      supabase.from("transactions").select("*").eq("user_id", currentUserId).order("id", { ascending: false }),
      supabase.from("deals").select("*").eq("user_id", currentUserId).order("id", { ascending: false }),
    ]);

    if (inventoryResult.error || transactionsResult.error || dealsResult.error) {
      setError(
        inventoryResult.error?.message ||
          transactionsResult.error?.message ||
          dealsResult.error?.message ||
          "Failed to fetch dashboard data."
      );
      setFetchingData(false);
      return;
    }

    const nextInventory = (inventoryResult.data ?? []) as InventoryRecord[];
    const nextTransactions = (transactionsResult.data ?? []) as TransactionRecord[];
    const nextDeals = (dealsResult.data ?? []) as DealRecord[];

    setInventory(nextInventory);
    setTransactions(nextTransactions);
    setDeals(nextDeals);

    setFetchingData(false);
  }, []);

  useEffect(() => {
    // Protect this route by checking auth on page load.
    async function checkUser() {
      if (!supabase) {
        setError(supabaseConfigError);
        setLoading(false);
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.replace("/login");
        return;
      }

      setUser({ id: authUser.id, email: authUser.email ?? "User" });
      await fetchData(authUser.id);
      setLoading(false);
    }

    checkUser();
  }, [router, fetchData]);

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      return;
    }

    if (!productName.trim() || !productStock.trim()) {
      setError("Please enter product name and stock.");
      return;
    }

    const stockValue = Number(productStock);
    if (Number.isNaN(stockValue) || stockValue < 0) {
      setError("Stock must be a valid non-negative number.");
      return;
    }

    setAddingProduct(true);
    setError("");
    setSuccess("");

    const { error: insertError } = await supabase.from("inventory").insert([
      {
        user_id: user.id,
        product: productName.trim(),
        stock: stockValue,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setAddingProduct(false);
      return;
    }

    setProductName("");
    setProductStock("");
    setSuccess("Product added successfully.");
    await fetchData(user.id);
    setAddingProduct(false);
  }

  async function addTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      return;
    }

    if (!transactionAmount.trim()) {
      setError("Please enter transaction amount.");
      return;
    }

    const amountValue = Number(transactionAmount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setError("Amount must be a valid positive number.");
      return;
    }

    setAddingTransaction(true);
    setError("");
    setSuccess("");

    const createdAt = new Date().toISOString();

    const { error: insertError } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type: transactionType,
        amount: amountValue,
        created_at: createdAt,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setAddingTransaction(false);
      return;
    }

    setTransactionAmount("");
    setSuccess("Transaction added successfully.");
    await fetchData(user.id);
    setAddingTransaction(false);
  }

  async function addDeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      return;
    }

    if (!dealName.trim() || !dealValue.trim() || !dealProbability.trim()) {
      setError("Please enter deal name, value, and probability.");
      return;
    }

    const valueAmount = Number(dealValue);
    const probabilityValue = Number(dealProbability);

    if (Number.isNaN(valueAmount) || valueAmount <= 0) {
      setError("Deal value must be a valid positive number.");
      return;
    }

    if (Number.isNaN(probabilityValue) || probabilityValue < 0 || probabilityValue > 1) {
      setError("Probability must be between 0 and 1 (example: 0.75).");
      return;
    }

    setAddingDeal(true);
    setError("");
    setSuccess("");

    const { error: insertError } = await supabase.from("deals").insert([
      {
        user_id: user.id,
        name: dealName.trim(),
        value: valueAmount,
        probability: probabilityValue,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setAddingDeal(false);
      return;
    }

    setDealName("");
    setDealValue("");
    setDealProbability("");
    setSuccess("Deal added successfully.");
    await fetchData(user.id);
    setAddingDeal(false);
  }

  async function deleteItem(table: "inventory" | "transactions" | "deals", itemId: number) {
    if (!supabase) {
      return;
    }

    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase.from(table).delete().eq("id", itemId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (user) {
      await fetchData(user.id);
    }

    setSuccess("Item deleted successfully.");
  }

  function startEditInventory(item: InventoryRecord) {
    setEditingInventoryId(item.id);
    setEditingInventoryStock(String(item.stock));
    setError("");
    setSuccess("");
  }

  function cancelEditInventory() {
    setEditingInventoryId(null);
    setEditingInventoryStock("");
  }

  async function updateItem(
    table: "inventory" | "deals",
    itemId: number,
    values: { stock?: number; probability?: number }
  ) {
    if (!supabase || !user) {
      return;
    }

    if (table === "inventory") {
      setSavingInventory(true);
    } else {
      setSavingDeal(true);
    }

    setError("");
    setSuccess("");

    const { error: updateError } = await supabase.from(table).update(values).eq("id", itemId);

    if (updateError) {
      setError(updateError.message);
      setSavingInventory(false);
      setSavingDeal(false);
      return;
    }

    if (table === "inventory") {
      cancelEditInventory();
    } else {
      setEditingDealId(null);
      setEditingDealProbability("");
    }

    await fetchData(user.id);
    setSuccess("Item updated successfully.");
    setSavingInventory(false);
    setSavingDeal(false);
  }

  function startEditDeal(item: DealRecord) {
    setEditingDealId(item.id);
    setEditingDealProbability(String(item.probability));
    setError("");
    setSuccess("");
  }

  function cancelEditDeal() {
    setEditingDealId(null);
    setEditingDealProbability("");
  }

  function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-sm text-slate-700 shadow-md">
          Loading...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-md">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-md">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Corelytics Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Welcome, {user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => user && fetchData(user.id)}
              disabled={fetchingData}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {fetchingData ? "Refreshing..." : "Refresh data"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-md" id="quick-actions">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-600">Jump straight to the forms you use most.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => scrollToSection("add-product")}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Product
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("add-transaction")}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("add-deal")}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Deal
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Total products</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalProducts}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Total expenses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">${totalExpenses.toFixed(2)}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Total deal value</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">${totalDealValue.toFixed(2)}</p>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">AI Insights</h2>
              <p className="mt-1 text-sm text-slate-600">Send your current user data to the backend decision engine.</p>
            </div>
            <button
              type="button"
              onClick={generateAiInsights}
              disabled={generatingInsights}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingInsights ? "Generating AI insights..." : "Generate AI Insights"}
            </button>
          </div>

          {aiInsights ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Status: {aiInsights.status ?? "ok"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {(aiInsights.insights ?? []).length} insights
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {(aiInsights.insights ?? []).map((insight, index) => (
                  <article key={`${insight.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-900">{insight.title}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {insight.severity}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                      <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explanation</p>
                        <p className="mt-1">{insight.explanation}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact</p>
                        <p className="mt-1">{insight.impact}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendation</p>
                        <p className="mt-1 font-medium text-blue-700">{insight.recommendation}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <article className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
                <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm text-slate-700 shadow-sm">
                  {aiInsights.summary ?? "No summary returned by the backend."}
                </p>
              </article>

              <article className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Metrics</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {renderMetricCards(aiInsights.metrics ?? {})}
                </div>
              </article>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No insights generated yet. Click the button above to analyze your data.</p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Scenario Simulation</h2>
              <p className="mt-1 text-sm text-slate-600">Compare what happens when you change one business variable.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={simulationType}
                onChange={(event) => setSimulationType(event.target.value as "increase_stock" | "increase_expense" | "deal_success")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-black outline-none ring-blue-500 focus:ring-2"
              >
                <option value="increase_stock">increase_stock</option>
                <option value="increase_expense">increase_expense</option>
                <option value="deal_success">deal_success</option>
              </select>
              <button
                type="button"
                onClick={runSimulation}
                disabled={simulating}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {simulating ? "Running simulation..." : "Run Simulation"}
              </button>
            </div>
          </div>

          {simulation ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl bg-slate-50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Before Metrics</h3>
                <div className="mt-3 space-y-3">
                  {renderMetricCards(simulation.before?.metrics ?? {})}
                </div>
              </article>
              <article className="rounded-2xl bg-slate-50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">After Metrics</h3>
                <div className="mt-3 space-y-3">
                  {renderMetricCards(simulation.after?.metrics ?? {})}
                </div>
              </article>
              <article className="rounded-2xl bg-slate-50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Impact</h3>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                  <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
                    <p className="font-semibold text-slate-900">Metrics Change</p>
                    <p className="mt-1">{simulation.impact?.metrics_change ?? "No metrics comparison returned."}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
                    <p className="font-semibold text-slate-900">Risk Change</p>
                    <p className="mt-1">{simulation.impact?.risk_change ?? "No risk comparison returned."}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
                    <p className="font-semibold text-slate-900">Decision Insight</p>
                    <p className="mt-1">{simulation.impact?.decision_insight ?? "No decision insight returned."}</p>
                  </div>
                </div>
              </article>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Run a scenario to compare before and after outcomes.</p>
          )}
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-md">
            {error}
          </section>
        ) : null}

        {success ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-md">
            {success}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-md" id="add-product">
            <h2 className="text-xl font-semibold text-slate-900">Add Product</h2>
            <form className="mt-4 space-y-3" onSubmit={addProduct}>
              <input
                type="text"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Product name"
              />
              <input
                type="number"
                value={productStock}
                onChange={(event) => setProductStock(event.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Stock"
                min={0}
              />
              <button
                type="submit"
                disabled={addingProduct}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingProduct ? "Adding..." : "Add Product"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-md" id="add-transaction">
            <h2 className="text-xl font-semibold text-slate-900">Add Transaction</h2>
            <form className="mt-4 space-y-3" onSubmit={addTransaction}>
              <select
                value={transactionType}
                onChange={(event) => setTransactionType(event.target.value as "income" | "expense")}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="income">income</option>
                <option value="expense">expense</option>
              </select>
              <input
                type="number"
                value={transactionAmount}
                onChange={(event) => setTransactionAmount(event.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amount"
                min={0}
                step="0.01"
              />
              <button
                type="submit"
                disabled={addingTransaction}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingTransaction ? "Adding..." : "Add Transaction"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-md" id="add-deal">
            <h2 className="text-xl font-semibold text-slate-900">Add Deal</h2>
            <form className="mt-4 space-y-3" onSubmit={addDeal}>
              <input
                type="text"
                value={dealName}
                onChange={(event) => setDealName(event.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deal name"
              />
              <input
                type="number"
                value={dealValue}
                onChange={(event) => setDealValue(event.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deal value"
                min={0}
                step="0.01"
              />
              <input
                type="number"
                value={dealProbability}
                onChange={(event) => setDealProbability(event.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Probability (0 to 1)"
                min={0}
                max={1}
                step="0.01"
              />
              <button
                type="submit"
                disabled={addingDeal}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingDeal ? "Adding..." : "Add Deal"}
              </button>
            </form>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">Inventory</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {inventory.length === 0 ? (
                <li className="rounded-xl bg-slate-50 px-3 py-2">No data yet. Add your first item.</li>
              ) : (
                inventory.map((item) => (
                  <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.product}</p>
                        <p className="text-xs text-slate-500">ID: {item.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingInventoryId === item.id ? (
                          <input
                            type="number"
                            value={editingInventoryStock}
                            onChange={(event) => setEditingInventoryStock(event.target.value)}
                            className="w-24 p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={0}
                          />
                        ) : (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                            Stock: {item.stock}
                          </span>
                        )}

                        {editingInventoryId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const nextStock = Number(editingInventoryStock);
                                if (Number.isNaN(nextStock) || nextStock < 0) {
                                  setError("Stock must be a valid non-negative number.");
                                  return;
                                }

                                updateItem("inventory", item.id, { stock: nextStock });
                              }}
                              disabled={savingInventory}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditInventory}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditInventory(item)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteItem("inventory", item.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">Transactions</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {transactions.length === 0 ? (
                <li className="rounded-xl bg-slate-50 px-3 py-2">No data yet. Add your first item.</li>
              ) : (
                transactions.map((transaction) => (
                  <li key={transaction.id} className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{transaction.type}</p>
                        <p className="text-xs text-slate-500">ID: {transaction.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          ${transaction.amount}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteItem("transactions", transaction.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">Deals</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {deals.length === 0 ? (
                <li className="rounded-xl bg-slate-50 px-3 py-2">No data yet. Add your first item.</li>
              ) : (
                deals.map((deal) => (
                  <li key={deal.id} className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{deal.name}</p>
                        <p className="text-xs text-slate-500">ID: {deal.id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          ${deal.value}
                        </span>

                        {editingDealId === deal.id ? (
                          <input
                            type="number"
                            value={editingDealProbability}
                            onChange={(event) => setEditingDealProbability(event.target.value)}
                            className="w-24 p-3 border rounded-lg bg-white text-black placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={0}
                            max={1}
                            step="0.01"
                          />
                        ) : (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                            {Math.round(deal.probability * 100)}%
                          </span>
                        )}

                        {editingDealId === deal.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const nextProbability = Number(editingDealProbability);
                                if (Number.isNaN(nextProbability) || nextProbability < 0 || nextProbability > 1) {
                                  setError("Probability must be between 0 and 1.");
                                  return;
                                }

                                updateItem("deals", deal.id, { probability: nextProbability });
                              }}
                              disabled={savingDeal}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditDeal}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditDeal(deal)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteItem("deals", deal.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
