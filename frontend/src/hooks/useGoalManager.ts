"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { Goal } from "@/types";
import { getGasOverrides, sendTx } from "@/lib/gas";
import { es } from "@/lib/i18n/es";
import { useAppStore } from "@/store/useAppStore";
import { precheckOnChainTx } from "@/lib/onChainPrecheck";
import { notifyOnChainError, notifyOnChainMessage } from "@/lib/onChainNotify";

const GOAL_MANAGER_ABI = [
  "function createGoal(string _name, string _emoji, uint256 _targetAmount, uint256 _deadline, uint256 _monthlyContribution) external returns (uint256)",
  "function fundGoal(uint256 _goalId, uint256 _amount) external",
  "function fundGoalFromVault(uint256 _goalId, uint256 _amount) external",
  "function cancelGoal(uint256 _goalId) external",
  "function getUserGoals(address _user) external view returns (tuple(uint256 id, address owner, string name, string emoji, uint256 targetAmount, uint256 savedAmount, uint256 deadline, uint256 monthlyContribution, uint8 status, uint256 createdAt, uint256 completedAt)[])",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
];

const GOAL_STATUS = ["active", "completed", "cancelled"] as const;

type RawGoal = {
  id: bigint;
  owner: string;
  name: string;
  emoji: string;
  targetAmount: bigint;
  savedAmount: bigint;
  deadline: bigint;
  monthlyContribution: bigint;
  status: number;
  createdAt: bigint;
  completedAt: bigint;
};

export function mapOnChainGoal(raw: RawGoal): Goal {
  const status = GOAL_STATUS[raw.status] ?? "active";
  return {
    id: `chain-${raw.id.toString()}`,
    name: raw.name,
    emoji: raw.emoji || "🎯",
    targetAmount: Number(ethers.formatUnits(raw.targetAmount, 6)),
    savedAmount: Number(ethers.formatUnits(raw.savedAmount, 6)),
    deadline: new Date(Number(raw.deadline) * 1000).toISOString().slice(0, 10),
    monthlyContribution: Number(ethers.formatUnits(raw.monthlyContribution, 6)),
    status,
  };
}

export function parseChainGoalId(goalId: string): bigint | null {
  if (!goalId.startsWith("chain-")) return null;
  return BigInt(goalId.slice(6));
}

export function useGoalManager() {
  const { signer, chainId, address, provider } = useWallet();
  const nativeEthBalance = useAppStore((s) => s.nativeEthBalance);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPrecheck = useCallback(() => {
    const check = precheckOnChainTx(chainId, nativeEthBalance, "goalManager");
    if (!check.ok) {
      notifyOnChainMessage(check.message);
      throw new Error(check.message);
    }
  }, [chainId, nativeEthBalance]);

  const getContract = useCallback(
    (withSigner = true) => {
      if (!chainId) return null;
      const addrs = CONTRACT_ADDRESSES[chainId];
      if (!addrs?.goalManager?.trim()) return null;
      const runner = withSigner ? signer : provider;
      if (!runner) return null;
      return {
        goalManager: new ethers.Contract(addrs.goalManager, GOAL_MANAGER_ABI, runner),
        usdc: addrs.usdc,
        goalManagerAddress: addrs.goalManager,
      };
    },
    [signer, provider, chainId]
  );

  const fetchGoals = useCallback(async (): Promise<Goal[]> => {
    const ctx = getContract(false);
    if (!ctx || !address) return [];
    const raw = (await ctx.goalManager.getUserGoals(address)) as RawGoal[];
    return raw.map(mapOnChainGoal);
  }, [getContract, address]);

  const createGoal = useCallback(
    async (input: {
      name: string;
      emoji: string;
      targetAmount: number;
      deadline: string;
      monthlyContribution: number;
    }) => {
      const ctx = getContract(true);
      if (!ctx || !address) throw new Error(es.errors.goalManagerNotConfigured);

      if (input.monthlyContribution <= 0) throw new Error(es.errors.monthlyContributionRequired);

      runPrecheck();
      setIsLoading(true);
      setError(null);
      try {
        const deadlineTs = Math.floor(new Date(`${input.deadline}T23:59:59`).getTime() / 1000);
        const receipt = await sendTx(
          ctx.goalManager,
          "createGoal",
          [
            input.name,
            input.emoji,
            ethers.parseUnits(input.targetAmount.toString(), 6),
            deadlineTs,
            ethers.parseUnits(input.monthlyContribution.toString(), 6),
          ],
          signer!
        );
        return receipt;
      } catch (e) {
        const msg = notifyOnChainError(e, es.errors.txFailed);
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract, address, signer, runPrecheck]
  );

  const fundGoalFromVault = useCallback(
    async (goalId: string, amountUSDC: number) => {
      const ctx = getContract(true);
      const id = parseChainGoalId(goalId);
      if (!ctx || id == null || !signer) throw new Error(es.errors.invalidGoal);

      runPrecheck();
      setIsLoading(true);
      setError(null);
      try {
        const receipt = await sendTx(
          ctx.goalManager,
          "fundGoalFromVault",
          [id, ethers.parseUnits(amountUSDC.toString(), 6)],
          signer
        );
        return receipt;
      } catch (e) {
        const msg = notifyOnChainError(e, es.errors.txFailed);
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract, signer, runPrecheck]
  );

  const fundGoalFromWallet = useCallback(
    async (goalId: string, amountUSDC: number) => {
      const ctx = getContract(true);
      const id = parseChainGoalId(goalId);
      if (!ctx || id == null || !signer) throw new Error(es.errors.invalidGoal);

      runPrecheck();
      setIsLoading(true);
      setError(null);
      try {
        const amount = ethers.parseUnits(amountUSDC.toString(), 6);
        const gas = await getGasOverrides(signer);
        const usdc = new ethers.Contract(ctx.usdc, ERC20_ABI, signer);
        const approveTx = await usdc.approve(ctx.goalManagerAddress, amount, gas);
        await approveTx.wait();
        const receipt = await sendTx(ctx.goalManager, "fundGoal", [id, amount], signer);
        return receipt;
      } catch (e) {
        const msg = notifyOnChainError(e, es.errors.txFailed);
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract, signer, runPrecheck]
  );

  const cancelGoal = useCallback(
    async (goalId: string) => {
      const ctx = getContract(true);
      const id = parseChainGoalId(goalId);
      if (!ctx || id == null || !signer) throw new Error(es.errors.invalidGoal);

      runPrecheck();
      setIsLoading(true);
      setError(null);
      try {
        const receipt = await sendTx(ctx.goalManager, "cancelGoal", [id], signer);
        return receipt;
      } catch (e) {
        const msg = notifyOnChainError(e, es.errors.txFailed);
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract, signer, runPrecheck]
  );

  const hasGoalManager = !!getContract(false);

  return {
    fetchGoals,
    createGoal,
    fundGoalFromVault,
    fundGoalFromWallet,
    cancelGoal,
    hasGoalManager,
    isLoading,
    error,
  };
}
