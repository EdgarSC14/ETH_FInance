"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { CardHeader } from "@/components/ui/CardHeader";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { COLORS } from "@/lib/constants";
import { formatUSDC, percentOf } from "@/lib/utils";
import { staggerItem } from "@/lib/motion";
import { es } from "@/lib/i18n/es";
import { FinancialPlan } from "@/types";
import {
  buildBalanceProjection,
  buildOnChainAllocation,
  deriveFinancialMetrics,
} from "@/lib/financialMetrics";

const ALLOC_NAMES = es.dashboard.allocation;
const PIE_COLORS = COLORS.chart;
const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "8px 12px",
  color: "var(--text-primary)",
  fontSize: "12px",
  boxShadow: "var(--shadow-card)",
};

type ChartSlice = { name: string; value: number; isPercent?: boolean };

const DEMO_ALLOCATION: ChartSlice[] = [
  { name: ALLOC_NAMES.expenses, value: 50, isPercent: true },
  { name: ALLOC_NAMES.savings, value: 20, isPercent: true },
  { name: ALLOC_NAMES.emergency, value: 15, isPercent: true },
  { name: ALLOC_NAMES.invest, value: 10, isPercent: true },
  { name: ALLOC_NAMES.goals, value: 5, isPercent: true },
];

function formatAxisUsd(v: number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 100) / 10}k`;
  if (Math.abs(n) >= 100) return `$${Math.round(n)}`;
  if (Math.abs(n) >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

function yDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(10, min * 0.2);
    return [Math.max(0, min - pad), max + pad];
  }
  const span = max - min;
  return [Math.max(0, min - span * 0.12), max + span * 0.12];
}

function buildPlanAllocation(plan: FinancialPlan): ChartSlice[] {
  const goalsPct =
    100 -
    plan.allocation.expenses -
    plan.allocation.savings -
    plan.allocation.emergencyFund -
    plan.allocation.investments;

  return [
    { name: ALLOC_NAMES.expenses, value: plan.allocation.expenses, isPercent: true },
    { name: ALLOC_NAMES.savings, value: plan.allocation.savings, isPercent: true },
    { name: ALLOC_NAMES.emergency, value: plan.allocation.emergencyFund, isPercent: true },
    { name: ALLOC_NAMES.invest, value: plan.allocation.investments, isPercent: true },
    { name: ALLOC_NAMES.goals, value: goalsPct, isPercent: true },
  ].filter((d) => d.value > 0);
}

export function AllocationChart() {
  const {
    plan,
    monthlyIncome,
    monthlyExpenses,
    transactions,
    vaultBalance,
    walletUsdcBalance,
    goals,
  } = useAppStore();
  const { isConnected } = useWallet();

  const metrics = useMemo(
    () =>
      deriveFinancialMetrics(
        isConnected,
        transactions,
        vaultBalance,
        walletUsdcBalance,
        goals,
        monthlyIncome,
        monthlyExpenses,
      ),
    [isConnected, transactions, vaultBalance, walletUsdcBalance, goals, monthlyIncome, monthlyExpenses],
  );

  const walletUsdc = walletUsdcBalance ?? 0;
  const usePlanChart = !!plan?.allocation;
  const usePortfolioChart = isConnected && !usePlanChart;

  const allocationData = useMemo(() => {
    if (usePlanChart && plan?.allocation) return buildPlanAllocation(plan);
    if (usePortfolioChart) {
      return buildOnChainAllocation(walletUsdc, vaultBalance, metrics.goalsSaved, transactions, {
        wallet: es.dashboard.usdcInWallet,
        vault: es.dashboard.smartVault,
        goals: ALLOC_NAMES.goals,
        spent: es.dashboard.allocationSpent,
      });
    }
    return DEMO_ALLOCATION;
  }, [
    usePlanChart,
    usePortfolioChart,
    plan,
    walletUsdc,
    vaultBalance,
    metrics.goalsSaved,
    transactions,
  ]);

  const allocationTotal = useMemo(
    () => allocationData.reduce((sum, d) => sum + d.value, 0),
    [allocationData],
  );

  const projectionData = useMemo(() => {
    if (plan?.projections?.length) {
      return plan.projections.map((p) => ({
        month: p.month,
        balance: p.balance,
      }));
    }
    if (isConnected) {
      return buildBalanceProjection(metrics.totalUsdc, metrics.monthlySurplus);
    }
    return [];
  }, [plan?.projections, isConnected, metrics.totalUsdc, metrics.monthlySurplus]);

  const projectionDomain = useMemo(
    () => yDomain(projectionData.map((p) => p.balance)),
    [projectionData],
  );

  const chartTitle = usePortfolioChart ? es.dashboard.usdcDistribution : es.dashboard.incomeAllocation;
  const chartHint = usePortfolioChart
    ? es.dashboard.allocationOnChainHint
    : !isConnected
      ? es.dashboard.allocationDemoHint
      : null;

  const referenceIncome = usePortfolioChart ? metrics.income : monthlyIncome;

  const sliceAmount = (slice: ChartSlice) => {
    if (slice.isPercent) return (referenceIncome * slice.value) / 100;
    return slice.value;
  };

  const slicePercent = (slice: ChartSlice) => {
    if (slice.isPercent) return slice.value;
    if (allocationTotal <= 0) return 0;
    return percentOf(slice.value, allocationTotal);
  };

  return (
    <GlassCard className="card-padding col-span-full lg:col-span-2" variants={staggerItem}>
      <CardHeader title={chartTitle} subtitle={chartHint ?? undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <div className="chart-panel">
          {allocationData.length > 0 ? (
            <ClientOnly fallback={<div className="h-[220px]" />}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={600}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={2}
                  >
                    {allocationData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, _name, item) => {
                      const slice = item.payload as ChartSlice;
                      const pct = slicePercent(slice);
                      if (slice.isPercent) {
                        return [`${Number(v).toFixed(1)}% · ${formatUSDC(sliceAmount(slice))}`, ""];
                      }
                      return [`${formatUSDC(Number(v))} (${pct.toFixed(1)}%)`, ""];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ClientOnly>
          ) : (
            <div className="h-[220px] empty-state">
              <p className="empty-state-hint">{es.dashboard.noFundsForChart}</p>
            </div>
          )}
          <div className="chart-legend">
            {allocationData.map((d, i) => (
              <div key={i} className="chart-legend-item">
                <span className="chart-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate">{d.name}</span>
                <span className="chart-legend-value">
                  {d.isPercent ? `${d.value}%` : formatUSDC(d.value, d.value >= 100 ? 0 : 2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-panel flex flex-col">
          <p className="form-label mb-3">{es.dashboard.projection6m}</p>
          {isConnected && !plan?.projections?.length && (
            <p className="card-subtitle mb-3">{es.dashboard.projectionFromBalances}</p>
          )}
          {projectionData.length > 0 ? (
            <ClientOnly fallback={<div className="h-[220px]" />}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={projectionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    domain={projectionDomain}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatAxisUsd}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [formatUSDC(Number(v)), es.dashboard.balance]}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#balGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#10b981", stroke: "#050807", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnly>
          ) : (
            <div className="flex-1 empty-state min-h-[220px]">
              <p className="empty-state-hint">{es.dashboard.generatePlanForProjection}</p>
            </div>
          )}
        </div>
      </div>

      {allocationData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--border-subtle)]">
          {allocationData.slice(0, 4).map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="stat-tile text-center"
            >
              <div className="stat-tile-label truncate">{d.name}</div>
              <div className="stat-tile-value mt-1">
                {formatUSDC(sliceAmount(d), d.isPercent ? 0 : sliceAmount(d) >= 100 ? 0 : 2)}
              </div>
              <div className="text-xs mt-1 tabular-nums font-medium" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                {slicePercent(d).toFixed(1)}%
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
