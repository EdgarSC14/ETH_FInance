"use client";

import { useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useGoalManager } from "@/hooks/useGoalManager";
import { usePaymentRouter } from "@/hooks/usePaymentRouter";
import { useAppStore } from "@/store/useAppStore";
import { DEMO_INITIAL_VAULT_USDC, DEMO_GOALS, DEMO_PAYMENTS, DEMO_TRANSACTIONS } from "@/lib/constants";
import { refreshOnChainBalances } from "@/hooks/onChain/refreshBalances";
import { refreshOnChainGoals } from "@/hooks/onChain/refreshGoals";
import { refreshOnChainPayments } from "@/hooks/onChain/refreshPayments";
import { refreshOnChainTransactions } from "@/hooks/onChain/refreshTransactions";

/**
 * Centralized on-chain sync: single refresh cycle for balances, goals, payments, and tx history.
 */
export function useOnChainSync() {
  const { isConnected, chainId, address, provider } = useWallet();
  const { fetchGoals, hasGoalManager } = useGoalManager();
  const { fetchPayments, hasPaymentRouter } = usePaymentRouter();

  const balanceRefreshKey = useAppStore((s) => s.balanceRefreshKey);
  const goalsRefreshKey = useAppStore((s) => s.goalsRefreshKey);
  const paymentsRefreshKey = useAppStore((s) => s.paymentsRefreshKey);
  const transactionsRefreshKey = useAppStore((s) => s.transactionsRefreshKey);

  const setWalletUsdcBalance = useAppStore((s) => s.setWalletUsdcBalance);
  const setNativeEthBalance = useAppStore((s) => s.setNativeEthBalance);
  const setVaultBalance = useAppStore((s) => s.setVaultBalance);
  const setOnChainBalancesLoading = useAppStore((s) => s.setOnChainBalancesLoading);
  const setGoals = useAppStore((s) => s.setGoals);
  const setOnChainGoalsLoading = useAppStore((s) => s.setOnChainGoalsLoading);
  const setPayments = useAppStore((s) => s.setPayments);
  const setOnChainPaymentsLoading = useAppStore((s) => s.setOnChainPaymentsLoading);
  const setTransactions = useAppStore((s) => s.setTransactions);
  const setOnChainTransactionsLoading = useAppStore((s) => s.setOnChainTransactionsLoading);

  const refreshAll = useCallback(async () => {
    if (!isConnected || !provider || !address || chainId == null) return;

    setOnChainBalancesLoading(true);
    setOnChainGoalsLoading(true);
    setOnChainPaymentsLoading(true);
    setOnChainTransactionsLoading(true);

    try {
      await Promise.all([
        refreshOnChainBalances({
          provider,
          address,
          chainId,
          setWalletUsdcBalance,
          setNativeEthBalance,
          setVaultBalance,
        }),
        hasGoalManager ? refreshOnChainGoals({ fetchGoals, setGoals }) : Promise.resolve(),
        hasPaymentRouter ? refreshOnChainPayments({ fetchPayments, setPayments }) : Promise.resolve(),
        refreshOnChainTransactions({ provider, address, chainId, setTransactions }),
      ]);
    } finally {
      setOnChainBalancesLoading(false);
      setOnChainGoalsLoading(false);
      setOnChainPaymentsLoading(false);
      setOnChainTransactionsLoading(false);
    }
  }, [
    isConnected,
    provider,
    address,
    chainId,
    hasGoalManager,
    hasPaymentRouter,
    fetchGoals,
    fetchPayments,
    setWalletUsdcBalance,
    setNativeEthBalance,
    setVaultBalance,
    setOnChainBalancesLoading,
    setGoals,
    setOnChainGoalsLoading,
    setPayments,
    setOnChainPaymentsLoading,
    setTransactions,
    setOnChainTransactionsLoading,
  ]);

  useEffect(() => {
    if (!isConnected) return;
    refreshAll();
  }, [isConnected, refreshAll, balanceRefreshKey, goalsRefreshKey, paymentsRefreshKey, transactionsRefreshKey]);

  // Clear stale on-chain data immediately when the user switches networks in
  // MetaMask. Without this, the dashboard briefly shows the previous chain's
  // balances/transactions until the new chain's data arrives.
  useEffect(() => {
    if (!isConnected || chainId == null) return;
    setWalletUsdcBalance(null);
    setNativeEthBalance(null);
    setVaultBalance(0);
    setGoals([]);
    setPayments([]);
    setTransactions([]);
    setOnChainBalancesLoading(true);
    setOnChainGoalsLoading(true);
    setOnChainPaymentsLoading(true);
    setOnChainTransactionsLoading(true);
  }, [
    chainId,
    isConnected,
    setWalletUsdcBalance,
    setNativeEthBalance,
    setVaultBalance,
    setGoals,
    setPayments,
    setTransactions,
    setOnChainBalancesLoading,
    setOnChainGoalsLoading,
    setOnChainPaymentsLoading,
    setOnChainTransactionsLoading,
  ]);

  useEffect(() => {
    if (isConnected) return;
    setWalletUsdcBalance(null);
    setNativeEthBalance(null);
    setOnChainBalancesLoading(false);
    setVaultBalance(DEMO_INITIAL_VAULT_USDC);
    setOnChainGoalsLoading(false);
    setGoals(DEMO_GOALS);
    setOnChainPaymentsLoading(false);
    setPayments(DEMO_PAYMENTS);
    setTransactions(DEMO_TRANSACTIONS);
  }, [
    isConnected,
    setWalletUsdcBalance,
    setNativeEthBalance,
    setVaultBalance,
    setOnChainBalancesLoading,
    setGoals,
    setOnChainGoalsLoading,
    setPayments,
    setOnChainPaymentsLoading,
    setTransactions,
  ]);

  return { refreshAll };
}
