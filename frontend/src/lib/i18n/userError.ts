import { es } from "./es";

const EXACT: Record<string, string> = {
  "Not connected": es.errors.notConnected,
  "Transaction failed": es.errors.txFailed,
  "Connection failed": es.errors.connectionFailed,
  "MetaMask not detected. Please install MetaMask.": es.errors.metamaskNotFound,
  "GoalManager not configured": es.errors.goalManagerNotConfigured,
  "PaymentRouter not configured": es.errors.paymentRouterNotConfigured,
  "Monthly contribution must be > 0": es.errors.monthlyContributionRequired,
  "Invalid goal": es.errors.invalidGoal,
  "Invalid payment": es.errors.invalidPayment,
  "Invalid recipient address": es.errors.invalidRecipient,
  "Recipient wallet address is required": es.errors.recipientRequired,
  "Connect wallet and configure PaymentRouter in .env.local": es.errors.connectPaymentRouter,
};

export type OnChainErrorKind =
  | "noContract"
  | "noGas"
  | "userRejected"
  | "txFailed"
  | "networkChanged"
  | "unknown";

export function classifyOnChainError(error: unknown): OnChainErrorKind {
  if (!(error instanceof Error)) return "unknown";
  const msg = error.message.trim();
  const lower = msg.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied")) return "userRejected";
  if (lower.includes("insufficient funds") || lower.includes("insufficient balance")) return "noGas";
  if (
    lower.includes("not configured") ||
    lower.includes("goalmanager not configured") ||
    lower.includes("paymentrouter not configured")
  ) {
    return "noContract";
  }
  if (lower.includes("network changed") || lower.includes("chain id")) return "networkChanged";
  if (lower.includes("execution reverted") || lower.includes("nonce too low")) return "txFailed";
  if (msg === es.errors.txFailed || lower.includes("transaction failed")) return "txFailed";

  return "unknown";
}

export function messageForOnChainErrorKind(kind: OnChainErrorKind): string {
  switch (kind) {
    case "noContract":
      return es.errors.contractNotConfigured;
    case "noGas":
      return es.errors.noEthForGas;
    case "userRejected":
      return es.errors.userRejected;
    case "networkChanged":
      return es.errors.networkChanged;
    case "txFailed":
      return es.errors.txFailed;
    default:
      return es.errors.txFailed;
  }
}

export function userErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const msg = error.message.trim();
  if (EXACT[msg]) return EXACT[msg];
  const lower = msg.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return es.errors.userRejected;
  }
  if (lower.includes("insufficient")) return es.errors.insufficientFunds;
  if (lower.includes("network changed")) return es.errors.networkChanged;
  if (lower.includes("execution reverted")) return es.errors.executionReverted;
  if (lower.includes("nonce too low")) return es.errors.nonceTooLow;
  if (lower.startsWith("api error:")) {
    const status = Number(msg.replace(/\D/g, ""));
    return Number.isFinite(status) ? es.errors.apiError(status) : es.errors.apiErrorGeneric;
  }
  return msg;
}
