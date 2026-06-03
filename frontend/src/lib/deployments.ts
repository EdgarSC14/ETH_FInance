import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { SUPPORTED_CHAINS } from "@/lib/chains";

/** All EVM testnets the app can switch to in MetaMask. */
export function getSupportedChainIds(): number[] {
  return Object.keys(SUPPORTED_CHAINS)
    .map(Number)
    .sort((a, b) => a - b);
}

/** Chains with SmartVault deployed (full EthFinance stack). */
export function getDeployedChainIds(): number[] {
  return Object.entries(CONTRACT_ADDRESSES)
    .filter(([, cfg]) => !!cfg.smartVault?.trim())
    .map(([id]) => Number(id))
    .sort((a, b) => a - b);
}

export function isChainFullyDeployed(chainId: number | null): boolean {
  if (chainId == null) return false;
  const cfg = CONTRACT_ADDRESSES[chainId];
  return !!(
    cfg?.smartVault?.trim() &&
    cfg?.goalManager?.trim() &&
    cfg?.paymentRouter?.trim()
  );
}

export function hasReputationRegistry(chainId: number | null): boolean {
  if (chainId == null) return false;
  return !!CONTRACT_ADDRESSES[chainId]?.reputationRegistry?.trim();
}

export function getChainLabel(chainId: number): string {
  return SUPPORTED_CHAINS[chainId]?.label ?? `Chain ${chainId}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string | undefined {
  const base = SUPPORTED_CHAINS[chainId]?.blockExplorerUrls[0];
  if (!base || !txHash) return undefined;
  return `${base}/tx/${txHash}`;
}
