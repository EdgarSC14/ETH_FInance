"use client";
import { useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { usePaymentRouter } from "@/hooks/usePaymentRouter";
import { useAppStore } from "@/store/useAppStore";
import { DEMO_PAYMENTS } from "@/lib/constants";

export function useSyncOnChainPayments() {
  const { isConnected, address } = useWallet();
  const { fetchPayments, hasPaymentRouter } = usePaymentRouter();
  const paymentsRefreshKey = useAppStore((s) => s.paymentsRefreshKey);
  const setPayments = useAppStore((s) => s.setPayments);
  const setOnChainPaymentsLoading = useAppStore((s) => s.setOnChainPaymentsLoading);

  const refresh = useCallback(async () => {
    if (!isConnected || !address || !hasPaymentRouter) return;

    setOnChainPaymentsLoading(true);
    try {
      const onChain = await fetchPayments();
      setPayments(onChain);
    } catch {
      setPayments([]);
    } finally {
      setOnChainPaymentsLoading(false);
    }
  }, [isConnected, address, hasPaymentRouter, fetchPayments, setPayments, setOnChainPaymentsLoading]);

  useEffect(() => {
    if (!isConnected) return;
    refresh();
  }, [isConnected, refresh, paymentsRefreshKey]);

  useEffect(() => {
    if (!isConnected) {
      setOnChainPaymentsLoading(false);
      setPayments(DEMO_PAYMENTS);
    }
  }, [isConnected, setPayments, setOnChainPaymentsLoading]);
}
