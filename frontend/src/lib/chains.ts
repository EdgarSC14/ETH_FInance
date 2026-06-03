/** EVM testnets supported by EthFinance OS (MetaMask). */

export interface EvmChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const SUPPORTED_CHAINS: Record<number, EvmChainParams & { numericChainId: number; label: string }> = {
  421614: {
    numericChainId: 421614,
    label: "Arbitrum Sepolia",
    chainId: "0x66EEE",
    chainName: "Arbitrum Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io"],
  },
  84532: {
    numericChainId: 84532,
    label: "Base Sepolia",
    chainId: "0x14A34",
    chainName: "Base Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia-explorer.base.org"],
  },
  534351: {
    numericChainId: 534351,
    label: "Scroll Sepolia",
    chainId: "0x8274F",
    chainName: "Scroll Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [
      "https://sepolia-rpc.scroll.io",
      "https://rpc.scroll.io/sepolia",
    ],
    blockExplorerUrls: ["https://sepolia.scrollscan.com"],
  },
};

export const DEFAULT_CHAIN_ID = 421614;

export function isSupportedChain(chainId: number | null): boolean {
  return chainId != null && chainId in SUPPORTED_CHAINS;
}
