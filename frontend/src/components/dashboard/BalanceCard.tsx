"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet, Landmark } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getSupportedChainIds, getChainLabel, isChainFullyDeployed } from "@/lib/deployments";
import { formatUSDC } from "@/lib/utils";
import { staggerItem } from "@/lib/motion";
import { es } from "@/lib/i18n/es";

export function BalanceCard() {
  const {
    vaultBalance,
    monthlyIncome,
    monthlyExpenses,
    setDepositModalOpen,
    setWithdrawModalOpen,
    walletUsdcBalance,
    nativeEthBalance,
    onChainBalancesLoading,
  } = useAppStore();
  const { isConnected, chainId, formattedAddress, switchToChain } = useWallet();

  const cfg = chainId != null ? CONTRACT_ADDRESSES[chainId] : undefined;
  const chainOk = !!cfg?.usdc;
  const chainReady = isChainFullyDeployed(chainId);
  const hasVaultAddr = !!cfg?.smartVault?.trim();
  const supportedChains = getSupportedChainIds();

  const surplus = monthlyIncome - monthlyExpenses;
  const isPositive = surplus >= 0;
  const showDemoBudget = !isConnected;

  return (
    <GlassCard className="card-padding col-span-full lg:col-span-2" variant="highlight" variants={staggerItem}>
      <div className="flex flex-col gap-6 lg:gap-7">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <Wallet className="w-4 h-4 flex-shrink-0" />
            <span>{isConnected ? es.dashboard.yourBalances : es.dashboard.smartVaultDemo}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isConnected && (
              <Badge variant="neutral" className="font-mono text-[10px]">
                {formattedAddress}
              </Badge>
            )}
            <Badge variant={isConnected ? "income" : "neutral"}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />
              {isConnected ? es.dashboard.onChain : es.dashboard.demo}
            </Badge>
          </div>
        </div>

        {isConnected && !chainOk && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 space-y-3">
            <p>{es.dashboard.wrongNetworkHint}</p>
            <div className="flex flex-wrap gap-2">
              {supportedChains.map((id) => (
                <Button
                  key={id}
                  size="sm"
                  variant="secondary"
                  onClick={() => switchToChain(id)}
                >
                  {es.dashboard.switchTo} {getChainLabel(id)}
                </Button>
              ))}
            </div>
            {nativeEthBalance != null && (
              <p className="text-[var(--text-muted)] text-xs">
                {es.dashboard.nativeEthOnNetwork}{" "}
                <strong className="text-[var(--text-primary)]">{nativeEthBalance.toFixed(4)} ETH</strong>
              </p>
            )}
          </div>
        )}

        {isConnected && chainOk && !chainReady && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
            {es.dashboard.partialChainHint}
          </div>
        )}

        {isConnected && chainOk && (
          <>
            <div>
              <div className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                {es.dashboard.usdcInWallet}
                {onChainBalancesLoading && (
                  <span className="text-emerald-500/80 normal-case">{es.dashboard.updating}</span>
                )}
              </div>
              <div className="font-amount font-semibold text-[var(--text-primary)] tracking-tight">
                {walletUsdcBalance == null && onChainBalancesLoading ? (
                  <span className="text-[var(--text-muted)]">—</span>
                ) : walletUsdcBalance == null && !onChainBalancesLoading ? (
                  <span className="text-amber-400/90 text-sm font-sans">{es.dashboard.balanceReadFailed}</span>
                ) : (
                  <>$<AnimatedNumber value={walletUsdcBalance ?? 0} decimals={2} /></>
                )}
              </div>
              <div className="mt-2 text-[var(--text-muted)] text-sm space-y-1">
                <p>{es.dashboard.usdcNote}</p>
                {nativeEthBalance != null && (
                  <p className="text-xs">
                    {es.dashboard.ethGas}:{" "}
                    <strong className="text-[var(--text-primary)]">{nativeEthBalance.toFixed(4)} ETH</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="stat-tile flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="stat-tile-label">{es.dashboard.smartVault}</div>
                  <div className="stat-tile-value">{formatUSDC(vaultBalance)}</div>
                  {!chainReady && (
                    <div className="text-[10px] text-amber-400/90 mt-1 max-w-[220px]">
                      {es.dashboard.vaultNeedsDeploy}
                    </div>
                  )}
                  {chainReady && !hasVaultAddr && (
                    <div className="text-[10px] text-amber-400/90 mt-1 max-w-[220px]">
                      {es.dashboard.noContractEnv}
                    </div>
                  )}
                </div>
              </div>
              <div className="stat-tile bg-emerald-500/8 border-emerald-500/20 flex flex-col justify-center">
                <div className="stat-tile-label text-emerald-400/90">{es.dashboard.totalUsdc}</div>
                <div className="stat-tile-value text-xl">{formatUSDC((walletUsdcBalance ?? 0) + vaultBalance)}</div>
              </div>
            </div>
          </>
        )}

        {!isConnected && (
          <>
            <div>
              <div className="font-amount font-semibold text-[var(--text-primary)] tracking-tight">
                $<AnimatedNumber value={vaultBalance} decimals={2} />
              </div>
              <div className="mt-1 text-[var(--text-muted)] text-sm">{es.dashboard.usdcDemoVault}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="stat-tile bg-emerald-500/8 border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {es.dashboard.monthlyIncome}
                </div>
                <div className="stat-tile-value">{formatUSDC(monthlyIncome)}</div>
              </div>
              <div className="stat-tile bg-red-500/8 border-red-500/20">
                <div className="flex items-center gap-1.5 text-red-400 text-xs mb-2">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {es.dashboard.monthlyExpenses}
                </div>
                <div className="stat-tile-value">{formatUSDC(monthlyExpenses)}</div>
              </div>
            </div>
          </>
        )}

        {showDemoBudget && (
          <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
            <div
              className={`flex items-center gap-1.5 text-sm font-medium font-amount ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? es.dashboard.monthlySurplus : es.dashboard.monthlyDeficit}:{" "}
              {formatUSDC(Math.abs(surplus))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setWithdrawModalOpen(true)}
                icon={<ArrowDownLeft className="w-4 h-4" />}
                size="sm"
                disabled={vaultBalance <= 0}
              >
                {es.dashboard.withdraw}
              </Button>
              <Button onClick={() => setDepositModalOpen(true)} icon={<ArrowUpRight className="w-4 h-4" />} size="sm">
                {es.dashboard.deposit}
              </Button>
            </div>
          </div>
        )}

        {isConnected && chainOk && chainReady && (
          <div className="flex justify-end gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => setWithdrawModalOpen(true)}
              icon={<ArrowDownLeft className="w-4 h-4" />}
              size="sm"
              disabled={vaultBalance <= 0}
            >
              {es.dashboard.withdraw}
            </Button>
            <Button onClick={() => setDepositModalOpen(true)} icon={<ArrowUpRight className="w-4 h-4" />} size="sm">
              {es.dashboard.depositToVault}
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
