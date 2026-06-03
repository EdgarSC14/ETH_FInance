"use client";
import { useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useGoalManager } from "@/hooks/useGoalManager";
import { useAppStore } from "@/store/useAppStore";
import { DEMO_GOALS } from "@/lib/constants";

/**
 * Loads GoalManager goals when wallet is connected; restores demo goals on disconnect.
 */
export function useSyncOnChainGoals() {
  const { isConnected, address } = useWallet();
  const { fetchGoals, hasGoalManager } = useGoalManager();
  const goalsRefreshKey = useAppStore((s) => s.goalsRefreshKey);
  const setGoals = useAppStore((s) => s.setGoals);
  const setOnChainGoalsLoading = useAppStore((s) => s.setOnChainGoalsLoading);

  const refresh = useCallback(async () => {
    if (!isConnected || !address || !hasGoalManager) {
      return;
    }

    setOnChainGoalsLoading(true);
    try {
      const onChain = await fetchGoals();
      setGoals(onChain);
    } catch {
      setGoals([]);
    } finally {
      setOnChainGoalsLoading(false);
    }
  }, [isConnected, address, hasGoalManager, fetchGoals, setGoals, setOnChainGoalsLoading]);

  useEffect(() => {
    if (!isConnected) return;
    refresh();
  }, [isConnected, refresh, goalsRefreshKey]);

  useEffect(() => {
    if (!isConnected) {
      setOnChainGoalsLoading(false);
      setGoals(DEMO_GOALS);
    }
  }, [isConnected, setGoals, setOnChainGoalsLoading]);
}
