"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getGasOverrides, sendTx } from "@/lib/gas";
import { es } from "@/lib/i18n/es";
import { useAppStore } from "@/store/useAppStore";
import { precheckOnChainTx } from "@/lib/onChainPrecheck";
import { notifyOnChainError, notifyOnChainMessage } from "@/lib/onChainNotify";

const VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function balances(address user) external view returns (uint256)",
  "function addAllocationRule(address destination, uint16 basisPoints, string label) external",
  "function removeAllocationRule(uint256 index) external",
  "function getUserRules(address user) external view returns (tuple(address destination, uint16 basisPoints, string label, bool active)[])",
  "event Deposited(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

export function useVault() {
  const { signer, chainId, address } = useWallet();
  const nativeEthBalance = useAppStore((s) => s.nativeEthBalance);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getContracts = useCallback(() => {
    if (!signer || !chainId) return null;
    const addrs = CONTRACT_ADDRESSES[chainId];
    if (!addrs?.smartVault) return null;

    const vault = new ethers.Contract(addrs.smartVault, VAULT_ABI, signer);
    const usdc = new ethers.Contract(addrs.usdc, ERC20_ABI, signer);
    return { vault, usdc, addrs };
  }, [signer, chainId]);

  const runPrecheck = useCallback(() => {
    const check = precheckOnChainTx(chainId, nativeEthBalance, "smartVault");
    if (!check.ok) {
      notifyOnChainMessage(check.message);
      throw new Error(check.message);
    }
  }, [chainId, nativeEthBalance]);

  const deposit = useCallback(async (amountUSDC: number) => {
    const contracts = getContracts();
    if (!contracts || !address) throw new Error(es.errors.notConnected);

    runPrecheck();
    setIsLoading(true); setError(null); setTxHash(null);
    try {
      const amount = ethers.parseUnits(amountUSDC.toString(), 6);
      const gas = await getGasOverrides(signer!);

      const approveTx = await contracts.usdc.approve(contracts.addrs.smartVault, amount, gas);
      await approveTx.wait();

      const receipt = await sendTx(contracts.vault, "deposit", [amount], signer!);
      setTxHash(receipt?.hash ?? null);
      return receipt;
    } catch (e) {
      const msg = notifyOnChainError(e, es.errors.txFailed);
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [getContracts, address, signer, runPrecheck]);

  const withdraw = useCallback(async (amountUSDC: number) => {
    const contracts = getContracts();
    if (!contracts || !signer) throw new Error(es.errors.notConnected);

    runPrecheck();
    setIsLoading(true); setError(null); setTxHash(null);
    try {
      const amount = ethers.parseUnits(amountUSDC.toString(), 6);
      const receipt = await sendTx(contracts.vault, "withdraw", [amount], signer);
      setTxHash(receipt?.hash ?? null);
      return receipt;
    } catch (e) {
      const msg = notifyOnChainError(e, es.errors.txFailed);
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [getContracts, signer, runPrecheck]);

  const getBalance = useCallback(async (): Promise<number> => {
    const contracts = getContracts();
    if (!contracts || !address) return 0;
    const raw = await contracts.vault.balances(address);
    return Number(ethers.formatUnits(raw, 6));
  }, [getContracts, address]);

  const addRule = useCallback(async (destination: string, basisPoints: number, label: string) => {
    const contracts = getContracts();
    if (!contracts || !signer) throw new Error(es.errors.notConnected);
    runPrecheck();
    setIsLoading(true);
    try {
      await sendTx(contracts.vault, "addAllocationRule", [destination, basisPoints, label], signer);
    } catch (e) {
      notifyOnChainError(e, es.errors.txFailed);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [getContracts, signer, runPrecheck]);

  return { deposit, withdraw, getBalance, addRule, isLoading, txHash, error };
}
