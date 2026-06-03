/**
 * Testnet metadata for multi-chain deployment.
 * Override USDC with USDC_ADDRESS in .env when Circle updates addresses.
 */

import { checksumAddress } from "./checksum";

export type NetworkKey =
  | "hardhat"
  | "localhost"
  | "arbitrumSepolia"
  | "baseSepolia"
  | "scrollSepolia";

export interface NetworkConfig {
  key: NetworkKey;
  chainId: number;
  name: string;
  /** Circle / canonical testnet USDC. Empty = deploy MockUSDC. */
  defaultUsdc: string;
  explorer: string;
}

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  hardhat: {
    key: "hardhat",
    chainId: 31337,
    name: "Hardhat",
    defaultUsdc: "",
    explorer: "",
  },
  localhost: {
    key: "localhost",
    chainId: 1337,
    name: "Localhost",
    defaultUsdc: "",
    explorer: "",
  },
  arbitrumSepolia: {
    key: "arbitrumSepolia",
    chainId: 421614,
    name: "Arbitrum Sepolia",
    defaultUsdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    explorer: "https://sepolia.arbiscan.io",
  },
  baseSepolia: {
    key: "baseSepolia",
    chainId: 84532,
    name: "Base Sepolia",
    defaultUsdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    explorer: "https://sepolia.basescan.org",
  },
  scrollSepolia: {
    key: "scrollSepolia",
    chainId: 534351,
    name: "Scroll Sepolia",
    defaultUsdc: "0x2a56d0544C45A59486665a83987C65317367B901",
    explorer: "https://sepolia.scrollscan.com",
  },
};

export function resolveNetworkKey(networkName: string): NetworkKey | null {
  if (networkName in NETWORKS) return networkName as NetworkKey;
  return null;
}

export function resolveUsdcAddress(networkKey: NetworkKey): string {
  const fromEnv = process.env.USDC_ADDRESS?.trim();
  const defaultUsdc = NETWORKS[networkKey].defaultUsdc;

  if (networkKey === "hardhat" || networkKey === "localhost") {
    return fromEnv || "";
  }
  if (fromEnv) {
    const normalized = checksumAddress(fromEnv);
    console.warn(
      `[deploy] USDC_ADDRESS override (${normalized}) on ${networkKey}. ` +
        `Default for this chain is ${defaultUsdc || "MockUSDC"}. Clear USDC_ADDRESS if unsure.`,
    );
    return normalized;
  }
  return defaultUsdc;
}
