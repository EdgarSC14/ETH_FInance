import { getAddress } from "ethers";

/** EIP-55 normalize for deploy output and networks.ts defaults. */
export function checksumAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return "";
  try {
    return getAddress(trimmed);
  } catch {
    return getAddress(trimmed.toLowerCase());
  }
}
