"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { healthScoreColor, healthScoreLabel } from "@/lib/utils";
import { staggerItem } from "@/lib/motion";
import { es } from "@/lib/i18n/es";
import { computeHealthScore, deriveFinancialMetrics, getOnChainTransactions } from "@/lib/financialMetrics";

export function HealthScoreCard() {
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

  const score = useMemo(
    () => computeHealthScore(metrics, goals, plan?.healthScore),
    [metrics, goals, plan?.healthScore],
  );

  const color = healthScoreColor(score);
  const label = healthScoreLabel(score);

  const sourceHint =
    plan != null
      ? null
      : isConnected
        ? es.dashboard.healthScoreOnChain
        : es.dashboard.healthScoreDemo;

  return (
    <GlassCard className="card-padding flex flex-col items-center justify-center gap-5 min-h-[280px]" variants={staggerItem}>
      <p className="form-label">{es.dashboard.healthScore}</p>
      <ProgressRing value={score} size={140} strokeWidth={10} color={color}>
        <div className="text-center">
          <div className="font-amount text-3xl font-semibold text-[var(--text-primary)]">{score}</div>
          <div className="text-xs font-medium mt-0.5" style={{ color }}>
            {label}
          </div>
        </div>
      </ProgressRing>

      {sourceHint && (
        <p className="text-[11px] text-center text-[var(--text-muted)] px-2 leading-snug">{sourceHint}</p>
      )}

      {isConnected && !plan && getOnChainTransactions(transactions).length === 0 && metrics.totalUsdc === 0 && (
        <p className="text-[11px] text-center text-amber-400/90 px-2 leading-snug">{es.dashboard.healthScoreHint}</p>
      )}

      {plan?.alerts && plan.alerts.length > 0 && (
        <div className="w-full space-y-1.5">
          {plan.alerts.slice(0, 2).map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`text-xs rounded-lg px-3 py-2 border ${
                alert.level === "critical"
                  ? "bg-red-500/10 border-red-500/25 text-red-400"
                  : alert.level === "warning"
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              }`}
            >
              {alert.message}
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
