import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];
const VAULT_READ_ABI = ["function balances(address user) external view returns (uint256)"];

export async function refreshOnChainBalances(opts: {
  provider: ethers.Provider;
  address: string;
  chainId: number;
  setWalletUsdcBalance: (v: number | null) => void;
  setNativeEthBalance: (v: number | null) => void;
  setVaultBalance: (v: number) => void;
}): Promise<void> {
  const { provider, address, chainId, setWalletUsdcBalance, setNativeEthBalance, setVaultBalance } = opts;

  try {
    const rawEth = await provider.getBalance(address);
    setNativeEthBalance(Number(ethers.formatEther(rawEth)));
  } catch {
    setNativeEthBalance(null);
  }

  const cfg = CONTRACT_ADDRESSES[chainId];
  if (!cfg?.usdc) {
    setWalletUsdcBalance(null);
    setVaultBalance(0);
    return;
  }

  try {
    const usdc = new ethers.Contract(cfg.usdc, ERC20_ABI, provider);
    const rawWallet = await usdc.balanceOf(address);
    setWalletUsdcBalance(Number(ethers.formatUnits(rawWallet, 6)));
  } catch {
    setWalletUsdcBalance(null);
  }

  const vaultAddr = cfg.smartVault?.trim();
  if (!vaultAddr) {
    setVaultBalance(0);
    return;
  }

  try {
    const vault = new ethers.Contract(vaultAddr, VAULT_READ_ABI, provider);
    const rawVault = await vault.balances(address);
    setVaultBalance(Number(ethers.formatUnits(rawVault, 6)));
  } catch {
    setVaultBalance(0);
  }
}
