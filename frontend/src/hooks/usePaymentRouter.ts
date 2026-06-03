"use client";
import { useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { PaymentFrequency, ScheduledPayment } from "@/types";
import { sendTx } from "@/lib/gas";
import { es } from "@/lib/i18n/es";
import { useAppStore } from "@/store/useAppStore";
import { precheckOnChainTx } from "@/lib/onChainPrecheck";
import { notifyOnChainError, notifyOnChainMessage } from "@/lib/onChainNotify";

const PAYMENT_ROUTER_ABI = [
  "function schedulePayment(address _recipient, uint256 _amount, uint8 _frequency, uint256 _startTime, uint256 _timeLockDuration, string _label, uint256 _maxExecutions) external returns (uint256)",
  "function executePayment(uint256 _paymentId) external",
  "function cancelPayment(uint256 _paymentId) external",
  "function getUserPayments(address _user) external view returns (tuple(uint256 id, address owner, address recipient, uint256 amount, uint8 frequency, uint256 nextExecutionTime, uint256 timeLockEnd, string label, bool active, uint256 executionCount, uint256 maxExecutions)[])",
  "function getDuePayments(address _user) external view returns (uint256[])",
];

const FREQ_TO_ENUM: Record<PaymentFrequency, number> = {
  OneTime: 0,
  Daily: 1,
  Weekly: 2,
  Monthly: 3,
};

const ENUM_TO_FREQ: PaymentFrequency[] = ["OneTime", "Daily", "Weekly", "Monthly"];

type RawPayment = {
  id: bigint;
  owner: string;
  recipient: string;
  amount: bigint;
  frequency: number;
  nextExecutionTime: bigint;
  timeLockEnd: bigint;
  label: string;
  active: boolean;
  executionCount: bigint;
  maxExecutions: bigint;
};

export function mapOnChainPayment(raw: RawPayment, dueIds: Set<string>): ScheduledPayment {
  const now = Math.floor(Date.now() / 1000);
  const id = raw.id.toString();
  return {
    id: `chain-${id}`,
    recipient: raw.recipient,
    recipientLabel: raw.label || `${raw.recipient.slice(0, 6)}…${raw.recipient.slice(-4)}`,
    amount: Number(ethers.formatUnits(raw.amount, 6)),
    frequency: ENUM_TO_FREQ[raw.frequency] ?? "Monthly",
    nextDate: new Date(Number(raw.nextExecutionTime) * 1000).toISOString().slice(0, 10),
    label: raw.label,
    active: raw.active,
    executionCount: Number(raw.executionCount),
    timeLockEnd: Number(raw.timeLockEnd),
    isDue: dueIds.has(id),
    canCancel: raw.active && now >= Number(raw.timeLockEnd),
  };
}

export function parseChainPaymentId(paymentId: string): bigint | null {
  if (!paymentId.startsWith("chain-")) return null;
  return BigInt(paymentId.slice(6));
}

/** Ensures start time is at least 60s in the future (contract requirement). */
export function resolveStartTime(dateStr: string): number {
  const picked = Math.floor(new Date(`${dateStr}T12:00:00`).getTime() / 1000);
  const minStart = Math.floor(Date.now() / 1000) + 60;
  return Math.max(picked, minStart);
}

export function usePaymentRouter() {
  const { signer, chainId, address, provider } = useWallet();
  const nativeEthBalance = useAppStore((s) => s.nativeEthBalance);

  const runPrecheck = useCallback(() => {
    const check = precheckOnChainTx(chainId, nativeEthBalance, "paymentRouter");
    if (!check.ok) {
      notifyOnChainMessage(check.message);
      throw new Error(check.message);
    }
  }, [chainId, nativeEthBalance]);

  const getContract = useCallback(
    (withSigner = true) => {
      if (!chainId) return null;
      const addrs = CONTRACT_ADDRESSES[chainId];
      if (!addrs?.paymentRouter?.trim()) return null;
      const runner = withSigner ? signer : provider;
      if (!runner) return null;
      return new ethers.Contract(addrs.paymentRouter, PAYMENT_ROUTER_ABI, runner);
    },
    [signer, provider, chainId]
  );

  const fetchPayments = useCallback(async (): Promise<ScheduledPayment[]> => {
    const router = getContract(false);
    if (!router || !address) return [];

    const [raw, dueRaw] = await Promise.all([
      router.getUserPayments(address) as Promise<RawPayment[]>,
      router.getDuePayments(address) as Promise<bigint[]>,
    ]);

    const dueIds = new Set(dueRaw.map((id) => id.toString()));
    return raw.map((p) => mapOnChainPayment(p, dueIds));
  }, [getContract, address]);

  const schedulePayment = useCallback(
    async (input: {
      recipient: string;
      amount: number;
      frequency: PaymentFrequency;
      startDate: string;
      label: string;
      timeLockHours?: number;
    }) => {
      const router = getContract(true);
      if (!router || !signer) throw new Error(es.errors.paymentRouterNotConfigured);

      if (!ethers.isAddress(input.recipient)) throw new Error(es.errors.invalidRecipient);

      runPrecheck();
      const timeLockSeconds = Math.max(3600, (input.timeLockHours ?? 1) * 3600);
      try {
        return await sendTx(
          router,
          "schedulePayment",
          [
            input.recipient,
            ethers.parseUnits(input.amount.toString(), 6),
            FREQ_TO_ENUM[input.frequency],
            resolveStartTime(input.startDate),
            timeLockSeconds,
            input.label,
            0,
          ],
          signer
        );
      } catch (e) {
        notifyOnChainError(e, es.errors.txFailed);
        throw e;
      }
    },
    [getContract, signer, runPrecheck]
  );

  const executePayment = useCallback(
    async (paymentId: string) => {
      const router = getContract(true);
      const id = parseChainPaymentId(paymentId);
      if (!router || id == null || !signer) throw new Error(es.errors.invalidPayment);
      runPrecheck();
      try {
        return await sendTx(router, "executePayment", [id], signer);
      } catch (e) {
        notifyOnChainError(e, es.errors.txFailed);
        throw e;
      }
    },
    [getContract, signer, runPrecheck]
  );

  const cancelPayment = useCallback(
    async (paymentId: string) => {
      const router = getContract(true);
      const id = parseChainPaymentId(paymentId);
      if (!router || id == null || !signer) throw new Error(es.errors.invalidPayment);
      runPrecheck();
      try {
        return await sendTx(router, "cancelPayment", [id], signer);
      } catch (e) {
        notifyOnChainError(e, es.errors.txFailed);
        throw e;
      }
    },
    [getContract, signer, runPrecheck]
  );

  const hasPaymentRouter = !!getContract(false);

  return {
    fetchPayments,
    schedulePayment,
    executePayment,
    cancelPayment,
    hasPaymentRouter,
  };
}
