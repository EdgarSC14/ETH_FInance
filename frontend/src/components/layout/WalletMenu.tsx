"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Coins, Layers } from "lucide-react";
import { cn, formatUSDC } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { useAppStore } from "@/store/useAppStore";
import { getSupportedChainIds, getChainLabel, isChainFullyDeployed } from "@/lib/deployments";
import { es } from "@/lib/i18n/es";
import type { WalletDisplayCurrency } from "@/store/useAppStore";

interface WalletMenuProps {
  className?: string;
  compact?: boolean;
}

const CURRENCY_OPTIONS: { id: WalletDisplayCurrency; label: string }[] = [
  { id: "usdc", label: "USDC" },
  { id: "eth", label: "ETH" },
];

export function WalletMenu({ className, compact }: WalletMenuProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { chainId, switchToChain, formattedAddress } = useWallet();
  const walletDisplayCurrency = useAppStore((s) => s.walletDisplayCurrency);
  const setWalletDisplayCurrency = useAppStore((s) => s.setWalletDisplayCurrency);
  const walletUsdcBalance = useAppStore((s) => s.walletUsdcBalance);
  const vaultBalance = useAppStore((s) => s.vaultBalance);
  const nativeEthBalance = useAppStore((s) => s.nativeEthBalance);

  const supportedChains = getSupportedChainIds();
  const totalUsdc = (walletUsdcBalance ?? 0) + vaultBalance;
  const displayAmount =
    walletDisplayCurrency === "usdc"
      ? formatUSDC(totalUsdc)
      : `${(nativeEthBalance ?? 0).toFixed(4)} ETH`;
  const displayLabel =
    walletDisplayCurrency === "usdc" ? es.wallet.totalUsdc : es.wallet.nativeEth;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const handleSwitchChain = async (id: number) => {
    if (chainId === id) return;
    setSwitching(id);
    try {
      await switchToChain(id);
    } finally {
      setSwitching(null);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left",
          compact ? "px-2.5 py-2 w-full" : "px-3 py-2 min-w-[9rem]",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="flex-1 min-w-0">
          {!compact && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] truncate block">
              {formattedAddress}
            </span>
          )}
          <p className="font-mono text-[13px] sm:text-sm tabular-nums text-[var(--text-primary)] leading-tight truncate">
            {displayAmount}
          </p>
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--text-muted)] flex-shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,18rem)] max-h-[min(70dvh,24rem)] overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-bg-elevated shadow-xl z-[60]">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {es.wallet.network}
            </p>
          </div>
          <ul className="p-1.5 space-y-0.5" role="listbox">
            {supportedChains.map((id) => {
              const active = chainId === id;
              const full = isChainFullyDeployed(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={switching != null}
                    onClick={() => handleSwitchChain(id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "text-[var(--text-primary)] hover:bg-white/[0.05]",
                    )}
                  >
                    <Layers className="w-4 h-4 flex-shrink-0 opacity-70" />
                    <span className="flex-1 text-left truncate">{getChainLabel(id)}</span>
                    {full && (
                      <span className="text-[9px] text-emerald-400/80 uppercase">
                        {es.wallet.contractsReady}
                      </span>
                    )}
                    {active && <Check className="w-4 h-4 flex-shrink-0" />}
                    {switching === id && (
                      <span className="text-[10px] text-[var(--text-muted)]">{es.wallet.switching}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="px-3 py-2 border-t border-b border-[var(--border-subtle)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {es.wallet.currency}
            </p>
          </div>
          <div className="p-1.5 grid grid-cols-2 gap-1">
            {CURRENCY_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setWalletDisplayCurrency(id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm border transition-colors",
                  walletDisplayCurrency === id
                    ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-white/[0.04]",
                )}
              >
                <Coins className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
