import { getAddress } from "ethers";

/**
 * Normalize to EIP-55. Accepts lowercase addresses from env vars (Vercel, .env).
 * Empty string stays empty.
 */
export function checksumAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return "";
  try {
    return getAddress(trimmed);
  } catch {
    return getAddress(trimmed.toLowerCase());
  }
}

/** Env override with checksummed fallback (used in CONTRACT_ADDRESSES). */
export function resolveContractAddress(
  envValue: string | undefined,
  fallback: string,
): string {
  const raw = envValue?.trim() || fallback.trim();
  if (!raw) return "";
  return checksumAddress(raw);
}
