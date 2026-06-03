"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

const REPUTATION_ABI = ["function getScore(address _user) external view returns (uint256)"];

export function useReputationRegistry() {
  const { provider, chainId, address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!chainId || !provider) return null;
    const addr = CONTRACT_ADDRESSES[chainId]?.reputationRegistry?.trim();
    if (!addr) return null;
    return new ethers.Contract(addr, REPUTATION_ABI, provider);
  }, [chainId, provider]);

  const fetchScore = useCallback(async (): Promise<number> => {
    const contract = getContract();
    if (!contract || !address) return 0;

    setIsLoading(true);
    setError(null);
    try {
      const raw = (await contract.getScore(address)) as bigint;
      return Number(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al leer reputación";
      setError(msg);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [getContract, address]);

  const hasReputation = !!getContract();

  return { fetchScore, hasReputation, isLoading, error };
}
