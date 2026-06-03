"use client";
import { useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { useAppStore } from "@/store/useAppStore";
import { CONTRACT_ADDRESSES, DEMO_INITIAL_VAULT_USDC } from "@/lib/constants";

const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];
const VAULT_READ_ABI = ["function balances(address user) external view returns (uint256)"];

/**
 * Keeps native ETH (gas), wallet USDC + SmartVault balances in sync when MetaMask is connected.
 */
export function useSyncOnChainData() {
  const { isConnected, chainId, address, provider } = useWallet();
  const balanceRefreshKey = useAppStore((s) => s.balanceRefreshKey);
  const setWalletUsdcBalance = useAppStore((s) => s.setWalletUsdcBalance);
  const setNativeEthBalance = useAppStore((s) => s.setNativeEthBalance);
  const setVaultBalance = useAppStore((s) => s.setVaultBalance);
  const setOnChainBalancesLoading = useAppStore((s) => s.setOnChainBalancesLoading);

  const refresh = useCallback(async () => {
    if (!isConnected || !provider || !address || chainId == null) {
      return;
    }

    setOnChainBalancesLoading(true);
    try {
      const rawEth = await provider.getBalance(address);
      setNativeEthBalance(Number(ethers.formatEther(rawEth)));

      const cfg = CONTRACT_ADDRESSES[chainId];
      if (!cfg?.usdc) {
        setWalletUsdcBalance(null);
        setVaultBalance(0);
        return;
      }

      const usdc = new ethers.Contract(cfg.usdc, ERC20_ABI, provider);
      const rawWallet = await usdc.balanceOf(address);
      setWalletUsdcBalance(Number(ethers.formatUnits(rawWallet, 6)));

      const vaultAddr = cfg.smartVault?.trim();
      if (vaultAddr) {
        const vault = new ethers.Contract(vaultAddr, VAULT_READ_ABI, provider);
        const rawVault = await vault.balances(address);
        setVaultBalance(Number(ethers.formatUnits(rawVault, 6)));
      } else {
        setVaultBalance(0);
      }
    } catch {
      setWalletUsdcBalance(null);
      setNativeEthBalance(null);
      setVaultBalance(0);
    } finally {
      setOnChainBalancesLoading(false);
    }
  }, [
    isConnected,
    provider,
    address,
    chainId,
    setWalletUsdcBalance,
    setNativeEthBalance,
    setVaultBalance,
    setOnChainBalancesLoading,
  ]);

  useEffect(() => {
    if (!isConnected) return;
    refresh();
  }, [isConnected, refresh, balanceRefreshKey]);

  useEffect(() => {
    if (!isConnected) {
      setWalletUsdcBalance(null);
      setNativeEthBalance(null);
      setOnChainBalancesLoading(false);
      setVaultBalance(DEMO_INITIAL_VAULT_USDC);
    }
  }, [isConnected, setWalletUsdcBalance, setNativeEthBalance, setOnChainBalancesLoading, setVaultBalance]);
}
