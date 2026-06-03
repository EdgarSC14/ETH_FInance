import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { es } from "@/lib/i18n/es";

const MIN_ETH_FOR_GAS = 0.0001;

export type PrecheckResult = { ok: true } | { ok: false; message: string };

export function precheckOnChainTx(
  chainId: number | null,
  nativeEthBalance: number | null,
  contractKey: "smartVault" | "goalManager" | "paymentRouter",
): PrecheckResult {
  if (chainId == null) {
    return { ok: false, message: es.errors.notConnected };
  }

  const cfg = CONTRACT_ADDRESSES[chainId];
  const addr = cfg?.[contractKey]?.trim();
  if (!addr) {
    return { ok: false, message: es.errors.contractNotConfigured };
  }

  if (nativeEthBalance != null && nativeEthBalance < MIN_ETH_FOR_GAS) {
    return { ok: false, message: es.errors.noEthForGas };
  }

  return { ok: true };
}
