"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/hooks/useWallet";
import { useAppStore } from "@/store/useAppStore";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { notifyOnChainError, notifyOnChainMessage } from "@/lib/onChainNotify";

const MOCK_USDC_CHAINS = new Set<number>([534351]);

const MINT_AMOUNT_USDC = 1000;

const MOCK_USDC_ABI = ["function mint(address to, uint256 amount) external"];

export function MintMockUsdcButton() {
  const { signer, chainId, address } = useWallet();
  const bumpBalanceRefresh = useAppStore((s) => s.bumpBalanceRefresh);
  const [isLoading, setIsLoading] = useState(false);

  if (chainId == null || !MOCK_USDC_CHAINS.has(chainId)) return null;

  const cfg = CONTRACT_ADDRESSES[chainId];
  if (!cfg?.usdc) return null;

  const handleMint = async () => {
    if (!signer || !address) return;
    setIsLoading(true);
    try {
      const usdc = new ethers.Contract(cfg.usdc, MOCK_USDC_ABI, signer);
      const amount = ethers.parseUnits(MINT_AMOUNT_USDC.toString(), 6);
      const tx = await usdc.mint(address, amount);
      notifyOnChainMessage(`Acuñando ${MINT_AMOUNT_USDC} USDC de prueba…`);
      await tx.wait();
      notifyOnChainMessage(`✓ Recibiste ${MINT_AMOUNT_USDC} USDC de prueba`);
      bumpBalanceRefresh();
    } catch (e) {
      notifyOnChainError(e, "No se pudo acuñar USDC de prueba");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleMint}
      icon={<Coins className="w-4 h-4" />}
      size="sm"
      disabled={isLoading || !signer}
    >
      {isLoading ? "Acuñando…" : `Acuñar ${MINT_AMOUNT_USDC} USDC de prueba`}
    </Button>
  );
}
