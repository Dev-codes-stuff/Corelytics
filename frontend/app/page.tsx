"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api from "../utils/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
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
      <main className="min-h-screen bg-slate-100 p-6 md:p-10">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-slate-700 shadow-sm">
          Loading Corelytics dashboard...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 md:p-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  const minInventoryDays = Math.min(
    ...(inventory?.items ?? []).map((item) => item.stock / Math.max(item.daily_sales, 1))
  );

  let inventoryRisk = "Low";
  let inventoryRiskStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (minInventoryDays <= 7) {
    inventoryRisk = "High";
    inventoryRiskStyle = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (minInventoryDays <= 14) {
    inventoryRisk = "Medium";
    inventoryRiskStyle = "bg-amber-50 text-amber-700 border-amber-200";
  }

  const cashForecast = finance?.cash_forecast_10_days ?? 0;
  const currentCash = finance?.data.cash ?? 0;

  let cashStatus = "Healthy";
  let cashStatusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (cashForecast < 0) {
    cashStatus = "Critical";
    cashStatusStyle = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (cashForecast < currentCash) {
    cashStatus = "Watch";
    cashStatusStyle = "bg-amber-50 text-amber-700 border-amber-200";
  }

  const salesOpportunitiesCount = sales?.high_probability_deals.length ?? 0;

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-900 px-6 py-5 text-white shadow-sm">
          <h1 className="text-2xl font-bold">Corelytics AI ERP Dashboard</h1>
          <p className="mt-1 text-sm text-slate-200">Live view from FastAPI backend</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Inventory Risk
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">{inventoryRisk}</p>
            <span
              className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${inventoryRiskStyle}`}
            >
              Based on stock vs daily sales
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cash Status</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{cashStatus}</p>
            <span
              className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cashStatusStyle}`}
            >
              10-day forecast: ${cashForecast}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sales Opportunities
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">{salesOpportunitiesCount}</p>
            <span className="mt-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              High-probability deals
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-8 shadow-lg md:p-10">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Main Feature
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">AI Insights</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              Corelytics Intelligence
            </span>
          </div>

          <div className="rounded-2xl bg-white/80 p-5 shadow-sm md:p-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">🧠 Summary</h3>
            <p className="text-sm leading-7 text-slate-700 md:text-base">{insights?.summary}</p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-5 shadow-sm md:p-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">🚨 Alerts</h3>
              <ul className="space-y-2 text-sm text-slate-700 md:text-base">
                {(insights?.alerts ?? []).map((alert) => (
                  <li key={alert} className="rounded-lg bg-rose-50 px-3 py-2">
                    {alert}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white/80 p-5 shadow-sm md:p-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">✅ Recommendations</h3>
              <ul className="space-y-2 text-sm text-slate-700 md:text-base">
                {(insights?.recommendations ?? []).map((recommendation) => (
                  <li key={recommendation} className="rounded-lg bg-emerald-50 px-3 py-2">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Card title="Model Chart Preview">
          <p className="mb-3 text-sm text-slate-700">Loaded directly from deployed backend image endpoint.</p>
          {API_BASE_URL ? (
            <Image
              src={`${API_BASE_URL}/models/demo/plots`}
              alt="Corelytics model chart"
              width={1400}
              height={420}
              className="w-full rounded-xl border border-slate-200"
              unoptimized
            />
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Set NEXT_PUBLIC_API_URL in .env.local to load the chart.
            </p>
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-3">

          <Card title="Inventory Summary">
            <p className="mb-3 text-sm text-slate-700">Total items: {inventory?.count ?? 0}</p>
            <div className="space-y-2 text-sm text-slate-700">
              {(inventory?.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span>{item.item}</span>
                  <span>Stock: {item.stock}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Finance Summary">
            <div className="space-y-2 text-sm text-slate-700">
              <p>Current cash: ${finance?.data.cash ?? 0}</p>
              <p>Daily income: ${finance?.data.daily_income ?? 0}</p>
              <p>Daily expense: ${finance?.data.daily_expense ?? 0}</p>
              <p className="font-semibold text-slate-900">
                Forecast (10 days): ${finance?.cash_forecast_10_days ?? 0}
              </p>
            </div>
          </Card>

          <Card title="Sales Summary">
            <p className="mb-3 text-sm text-slate-700">Total deals: {sales?.count ?? 0}</p>
            <p className="mb-3 text-sm text-slate-700">
              High-probability deals: {sales?.high_probability_deals.length ?? 0}
            </p>
            <div className="space-y-2 text-sm text-slate-700">
              {(sales?.deals ?? []).map((deal) => (
                <div
                  key={deal.deal_id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
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
