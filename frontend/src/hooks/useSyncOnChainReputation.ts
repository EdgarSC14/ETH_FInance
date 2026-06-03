"use client";

import { useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useAppStore } from "@/store/useAppStore";
import { useReputationRegistry } from "@/hooks/useReputationRegistry";

export function useSyncOnChainReputation() {
  const { isConnected, chainId, address } = useWallet();
  const { fetchScore, hasReputation } = useReputationRegistry();
  const reputationRefreshKey = useAppStore((s) => s.reputationRefreshKey);
  const setReputationScore = useAppStore((s) => s.setReputationScore);
  const setOnChainReputationLoading = useAppStore((s) => s.setOnChainReputationLoading);

  const refresh = useCallback(async () => {
    if (!isConnected || !address || !hasReputation) {
      setReputationScore(null);
      return;
    }

    setOnChainReputationLoading(true);
    try {
      const score = await fetchScore();
      setReputationScore(score);
    } catch {
      setReputationScore(null);
    } finally {
      setOnChainReputationLoading(false);
    }
  }, [
    isConnected,
    address,
    hasReputation,
    fetchScore,
    setReputationScore,
    setOnChainReputationLoading,
  ]);

  useEffect(() => {
    if (!isConnected) {
      setReputationScore(null);
      setOnChainReputationLoading(false);
      return;
    }
    refresh();
  }, [isConnected, chainId, refresh, reputationRefreshKey, setReputationScore, setOnChainReputationLoading]);
}
