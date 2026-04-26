"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api from "../utils/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const CARD_CLASS =
  "rounded-2xl bg-white p-6 shadow-md transition-transform duration-200 hover:-translate-y-0.5";

type InventoryItem = {
  id: number;
  item: string;
  stock: number;
  daily_sales: number;
};

type InventoryResponse = {
  count: number;
  items: InventoryItem[];
};

type FinanceResponse = {
  data: {
    cash: number;
    daily_income: number;
    daily_expense: number;
  };
  cash_forecast_10_days: number;
};

type SalesDeal = {
  deal_id: string;
  customer: string;
  value: number;
  probability: number;
};

type SalesResponse = {
  count: number;
  deals: SalesDeal[];
  high_probability_deals: SalesDeal[];
};

type InsightsResponse = {
  alerts: string[];
  recommendations: string[];
  summary: string;
  predictions?: {
    inventory_days_left?: Record<string, number | null>;
    cash_forecast?: number;
  };
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={CARD_CLASS}>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({
  title,
  icon,
  value,
  note,
  badgeClass,
}: {
  title: string;
  icon: string;
  value: string | number;
  note: string;
  badgeClass: string;
}) {
  return (
    <div className={CARD_CLASS}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-bold text-gray-900">
        {icon} {value}
      </p>
      <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
        {note}
      </p>
    </div>
  );
}

function calculateInventoryDaysLeft(items: InventoryItem[]) {
  const daysLeft: Record<string, number | null> = {};

  items.forEach((item) => {
    if (item.daily_sales <= 0) {
      daysLeft[item.item] = null;
      return;
    }

    daysLeft[item.item] = Number((item.stock / item.daily_sales).toFixed(1));
  });

  return daysLeft;
}

function improveRecommendationText(
  recommendation: string,
  items: InventoryItem[],
  inventoryDaysLeft: Record<string, number | null>
) {
  // Beginner tip: convert generic backend text into a more actionable message.
  if (recommendation.startsWith("Reorder ") && recommendation.endsWith(" soon")) {
    const itemName = recommendation.replace("Reorder ", "").replace(" soon", "");
    const item = items.find((entry) => entry.item === itemName);
    const daysLeft = inventoryDaysLeft[itemName];

    if (item && daysLeft !== null && daysLeft !== undefined) {
      const reorderUnits = Math.max(item.daily_sales * 10 - item.stock, 20);
      const roundedDays = Math.max(1, Math.round(daysLeft));
      return `Reorder ${reorderUnits} units - stockout in ${roundedDays} days`;
    }
  }

  if (recommendation === "Keep daily cash flow positive") {
    return "Keep daily cash flow positive by controlling expense growth";
  }

  return recommendation;
}

export default function Home() {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [finance, setFinance] = useState<FinanceResponse | null>(null);
  const [sales, setSales] = useState<SalesResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!API_BASE_URL) {
        setError("NEXT_PUBLIC_API_URL is missing. Add it in frontend/.env.local and restart npm run dev.");
        setLoading(false);
        return;
      }

      try {
        const [inventoryRes, financeRes, salesRes, insightsRes] = await Promise.all([
          api.get("/inventory"),
          api.get("/finance"),
          api.get("/sales"),
          api.get("/ai/insights"),
        ]);

        setInventory(inventoryRes.data as InventoryResponse);
        setFinance(financeRes.data as FinanceResponse);
        setSales(salesRes.data as SalesResponse);
        setInsights(insightsRes.data as InsightsResponse);
      } catch {
        setError("Could not load data from backend. Check NEXT_PUBLIC_API_URL and CORS settings.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 text-gray-700 shadow-md">
          Loading insights...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-md">
          {error}
        </div>
      </main>
    );
  }

  const inventoryItems = inventory?.items ?? [];
  const inventoryDaysLeft = insights?.predictions?.inventory_days_left ?? calculateInventoryDaysLeft(inventoryItems);

  // Beginner tip: metric status is based on smallest days-left value.
  const finiteInventoryDays = Object.values(inventoryDaysLeft).filter(
    (value): value is number => typeof value === "number"
  );
  const minInventoryDays = finiteInventoryDays.length > 0 ? Math.min(...finiteInventoryDays) : Infinity;

  let inventoryRisk = "Low";
  let inventoryRiskStyle = "bg-green-100 text-green-700";
  let inventoryRiskNote = "Stock levels are safe";

  if (minInventoryDays <= 7) {
    inventoryRisk = "High";
    inventoryRiskStyle = "bg-red-100 text-red-700";
    inventoryRiskNote = "Risk of stockout soon";
  } else if (minInventoryDays <= 14) {
    inventoryRisk = "Medium";
    inventoryRiskStyle = "bg-yellow-100 text-yellow-700";
    inventoryRiskNote = "Watch fast-moving items";
  }

  const cashForecast = insights?.predictions?.cash_forecast ?? finance?.cash_forecast_10_days ?? 0;
  const currentCash = finance?.data.cash ?? 0;

  let cashStatus = "Healthy";
  let cashStatusStyle = "bg-green-100 text-green-700";
  let cashStatusNote = "Cash trend looks stable";

  if (cashForecast < 0) {
    cashStatus = "Critical";
    cashStatusStyle = "bg-red-100 text-red-700";
    cashStatusNote = "Immediate action needed";
  } else if (cashForecast < currentCash) {
    cashStatus = "Warning";
    cashStatusStyle = "bg-yellow-100 text-yellow-700";
    cashStatusNote = "Cash is trending down";
  }

  const salesOpportunitiesCount = sales?.high_probability_deals.length ?? 0;
  const demandChartUrl = API_BASE_URL ? `${API_BASE_URL}/models/sales/forecast/plot` : "";
  const cashChartUrl = API_BASE_URL ? `${API_BASE_URL}/models/finance/cash-forecast/plot` : "";

  const alerts = insights?.alerts?.length ? insights.alerts : ["No alerts - business running smoothly"];
  const recommendations = (insights?.recommendations ?? []).map((recommendation) =>
    improveRecommendationText(recommendation, inventoryItems, inventoryDaysLeft)
  );
  const displayRecommendations =
    recommendations.length > 0 ? recommendations : ["No recommendations - keep current strategy"];

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Corelytics - Your AI Business Brain 🧠</h1>
          <p className="mt-2 text-base text-gray-600">Live insights powered by AI</p>
        </header>

        <section className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-md md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">Main Feature</p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Corelytics Intelligence 🧠</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-blue-100 md:text-lg">
              Real-time AI signals for inventory, finance, and sales performance.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-white/15 p-6 shadow-md backdrop-blur-sm">
              <h3 className="mb-3 text-xl font-semibold text-white">⚠️ Alerts</h3>
              <ul className="space-y-2 text-sm leading-6 text-blue-50 md:text-base">
                {alerts.map((alert) => (
                  <li key={alert} className="rounded-xl bg-white/15 px-3 py-2">
                    {alert}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white/15 p-6 shadow-md backdrop-blur-sm">
              <h3 className="mb-3 text-xl font-semibold text-white">💡 Recommendations</h3>
              <ul className="space-y-2 text-sm leading-6 text-blue-50 md:text-base">
                {displayRecommendations.map((recommendation) => (
                  <li key={recommendation} className="rounded-xl bg-white/15 px-3 py-2">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white/15 p-6 shadow-md backdrop-blur-sm">
              <h3 className="mb-3 text-xl font-semibold text-white">📊 Summary</h3>
              <p className="text-sm leading-7 text-blue-50 md:text-base">{insights?.summary}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Inventory Risk"
            icon="📦"
            value={inventoryRisk}
            note={inventoryRiskNote}
            badgeClass={inventoryRiskStyle}
          />
          <MetricCard
            title="Cash Status"
            icon="💰"
            value={cashStatus}
            note={cashStatusNote}
            badgeClass={cashStatusStyle}
          />
          <MetricCard
            title="Sales Opportunities"
            icon="🎯"
            value={salesOpportunitiesCount}
            note="High-probability deals"
            badgeClass="bg-green-100 text-green-700"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Demand Forecast Chart">
            <p className="mb-4 text-sm text-gray-600">Projected demand trend from the sales forecasting model.</p>
            {API_BASE_URL ? (
              <Image
                src={demandChartUrl}
                alt="Demand forecast chart"
                width={1200}
                height={520}
                className="w-full rounded-xl border border-gray-200"
                unoptimized
              />
            ) : (
              <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                Set NEXT_PUBLIC_API_URL in .env.local to load charts.
              </p>
            )}
          </Card>

          <Card title="Cash Flow Chart">
            <p className="mb-4 text-sm text-gray-600">10-day cash forecast generated by the finance model.</p>
            {API_BASE_URL ? (
              <Image
                src={cashChartUrl}
                alt="Cash flow chart"
                width={1200}
                height={520}
                className="w-full rounded-xl border border-gray-200"
                unoptimized
              />
            ) : (
              <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                Set NEXT_PUBLIC_API_URL in .env.local to load charts.
              </p>
            )}
          </Card>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Inventory Summary">
            <p className="mb-4 text-sm text-gray-600">Total items: {inventory?.count ?? 0}</p>
            <div className="space-y-2 text-sm text-gray-700">
              {(inventory?.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span>{item.item}</span>
                  <span>Stock: {item.stock}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Finance Summary">
            <div className="space-y-2 text-sm text-gray-700">
              <p>Current cash: ${finance?.data.cash ?? 0}</p>
              <p>Daily income: ${finance?.data.daily_income ?? 0}</p>
              <p>Daily expense: ${finance?.data.daily_expense ?? 0}</p>
              <p className="font-semibold text-gray-900">
                Forecast (10 days): ${finance?.cash_forecast_10_days ?? 0}
              </p>
            </div>
          </Card>

          <Card title="Sales Summary">
            <p className="mb-2 text-sm text-gray-600">Total deals: {sales?.count ?? 0}</p>
            <p className="mb-4 text-sm text-gray-600">
              High-probability deals: {sales?.high_probability_deals.length ?? 0}
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              {(sales?.deals ?? []).map((deal) => (
                <div
                  key={deal.deal_id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span>{deal.customer}</span>
                  <span>{Math.round(deal.probability * 100)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
