"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatUSDC } from "@/lib/utils";
import { es } from "@/lib/i18n/es";

type VaultActionButtonsProps = {
  mode: "demo" | "onchain";
  vaultBalance: number;
  walletUsdcBalance?: number | null;
  onDeposit: () => void;
  onWithdraw: () => void;
  className?: string;
};

function VaultActionButton({
  variant,
  icon,
  title,
  hint,
  disabled,
  disabledReason,
  onClick,
}: {
  variant: "deposit" | "withdraw";
  icon: React.ReactNode;
  title: string;
  hint?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}) {
  const isDeposit = variant === "deposit";

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      className={cn(
        "group relative flex min-h-[4.25rem] w-full flex-col items-start justify-center gap-1 rounded-xl border px-4 py-3.5 text-left transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-45",
        isDeposit
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-600/30 via-emerald-600/15 to-emerald-500/5 hover:from-emerald-600/40 hover:border-emerald-400/55 shadow-[0_0_24px_-8px_rgba(16,185,129,0.45)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-muted)]/80 hover:border-white/15 hover:bg-white/[0.06]",
      )}
    >
      <div className="flex w-full items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            isDeposit
              ? "border-emerald-400/35 bg-emerald-500/20 text-emerald-300"
              : "border-white/10 bg-white/5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-sm font-semibold tracking-tight",
              isDeposit ? "text-emerald-50" : "text-[var(--text-primary)]",
            )}
          >
            {title}
          </span>
          {hint && (
            <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)] group-hover:text-[var(--text-primary)]/80">
              {hint}
            </span>
          )}
        </span>
      </div>
      {disabled && disabledReason && (
        <span className="pl-[3.25rem] text-[10px] leading-snug text-amber-400/90">{disabledReason}</span>
      )}
    </motion.button>
  );
}

export function VaultActionButtons({
  mode,
  vaultBalance,
  walletUsdcBalance,
  onDeposit,
  onWithdraw,
  className,
}: VaultActionButtonsProps) {
  const walletUsdc = walletUsdcBalance ?? 0;
  const canDepositOnChain = walletUsdc > 0;
  const canWithdraw = vaultBalance > 0;

  const depositTitle = mode === "demo" ? es.dashboard.deposit : es.dashboard.depositToVault;
  const depositHint =
    mode === "onchain"
      ? canDepositOnChain
        ? es.dashboard.vaultDepositHint(formatUSDC(walletUsdc))
        : es.dashboard.vaultDepositNoWallet
      : es.dashboard.vaultDepositDemoHint;

  const withdrawHint =
    mode === "onchain"
      ? canWithdraw
        ? es.dashboard.vaultWithdrawHint(formatUSDC(vaultBalance))
        : es.dashboard.vaultWithdrawEmpty
      : canWithdraw
        ? es.dashboard.vaultWithdrawHint(formatUSDC(vaultBalance))
        : es.dashboard.vaultWithdrawEmpty;

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <VaultActionButton
        variant="deposit"
        icon={<ArrowUpRight className="h-5 w-5" aria-hidden />}
        title={depositTitle}
        hint={depositHint}
        disabled={mode === "onchain" && !canDepositOnChain}
        disabledReason={mode === "onchain" && !canDepositOnChain ? es.dashboard.vaultDepositDisabled : undefined}
        onClick={onDeposit}
      />
      <VaultActionButton
        variant="withdraw"
        icon={<ArrowDownLeft className="h-5 w-5" aria-hidden />}
        title={es.dashboard.withdraw}
        hint={withdrawHint}
        disabled={!canWithdraw}
        disabledReason={!canWithdraw ? es.dashboard.vaultWithdrawDisabled : undefined}
        onClick={onWithdraw}
      />
    </div>
  );
}
