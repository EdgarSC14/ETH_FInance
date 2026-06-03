"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { formatAddress } from "@/lib/utils";
import { es } from "@/lib/i18n/es";
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAINS, isSupportedChain, type EvmChainParams } from "@/lib/chains";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  formattedAddress: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToArbitrumSepolia: () => Promise<void>;
  switchToBaseSepolia: () => Promise<void>;
  switchToScrollSepolia: () => Promise<void>;
  switchToOptimismSepolia: () => Promise<void>;
  switchToChain: (chainId: number) => Promise<void>;
}

function chainParamsFor(chainId: number): EvmChainParams | null {
  const cfg = SUPPORTED_CHAINS[chainId];
  if (!cfg) return null;
  const { chainId: hex, chainName, nativeCurrency, rpcUrls, blockExplorerUrls } = cfg;
  return { chainId: hex, chainName, nativeCurrency, rpcUrls, blockExplorerUrls };
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initProvider = useCallback(async (eth: ethers.Eip1193Provider) => {
    const p = new ethers.BrowserProvider(eth);
    const s = await p.getSigner();
    const addr = await s.getAddress();
    const network = await p.getNetwork();
    setProvider(p);
    setSigner(s);
    setAddress(addr);
    setChainId(Number(network.chainId));
  }, []);

  useEffect(() => {
    const eth = (window as Window & { ethereum?: ethers.Eip1193Provider }).ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) initProvider(eth);
    });

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null); setSigner(null); setProvider(null);
      } else {
        initProvider(eth);
      }
    };
    const onChainChanged = () => initProvider(eth);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethAny = eth as any;
    ethAny.on("accountsChanged", onAccountsChanged);
    ethAny.on("chainChanged", onChainChanged);
    return () => {
      ethAny.removeListener("accountsChanged", onAccountsChanged);
      ethAny.removeListener("chainChanged", onChainChanged);
    };
  }, [initProvider]);

  const switchNetwork = useCallback(async (params: EvmChainParams) => {
    const eth = (window as Window & { ethereum?: ethers.Eip1193Provider }).ethereum;
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: params.chainId }] });
    } catch {
      await eth.request({ method: "wallet_addEthereumChain", params: [params] });
    }
  }, []);

  const connect = useCallback(async () => {
    const eth = (window as Window & { ethereum?: ethers.Eip1193Provider }).ethereum;
    if (!eth) {
      setError(es.errors.metamaskNotFound);
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await eth.request({ method: "eth_requestAccounts" });
      await initProvider(eth);

      const p = new ethers.BrowserProvider(eth);
      const network = await p.getNetwork();
      const currentId = Number(network.chainId);
      if (!isSupportedChain(currentId)) {
        const params = chainParamsFor(DEFAULT_CHAIN_ID);
        if (params) await switchNetwork(params);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : es.errors.connectionFailed);
    } finally {
      setIsConnecting(false);
    }
  }, [initProvider, switchNetwork]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
  }, []);

  const switchToChain = useCallback(
    async (id: number) => {
      const params = chainParamsFor(id);
      if (!params) return;
      await switchNetwork(params);
    },
    [switchNetwork],
  );

  return {
    address,
    chainId,
    provider,
    signer,
    isConnecting,
    isConnected: !!address,
    error,
    formattedAddress: address ? formatAddress(address) : "",
    connect,
    disconnect,
    switchToArbitrumSepolia: () => switchToChain(421614),
    switchToBaseSepolia: () => switchToChain(84532),
    switchToScrollSepolia: () => switchToChain(534351),
    switchToOptimismSepolia: () => switchToChain(11155420),
    switchToChain,
  };
}
