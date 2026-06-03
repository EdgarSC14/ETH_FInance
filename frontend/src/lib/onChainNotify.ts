import { useAppStore } from "@/store/useAppStore";
import { userErrorMessage } from "@/lib/i18n/userError";

export function notifyOnChainError(error: unknown, fallback: string): string {
  const msg = userErrorMessage(error, fallback);
  useAppStore.getState().showToast(msg);
  return msg;
}

export function notifyOnChainMessage(message: string): void {
  useAppStore.getState().showToast(message);
}
