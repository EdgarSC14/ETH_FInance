import { FinancialPlan, Transaction, Goal } from "@/types";
import { BACKEND_URL } from "./constants";

interface ProfilePayload {
  address: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentBalance: number;
  transactions: Transaction[];
  goals: Goal[];
  riskTolerance: "conservative" | "moderate" | "aggressive";
}

export type AiApiMeta = { demoMode?: boolean; warning?: string };

import { es } from "./i18n/es";

async function parseAiResponse<T>(res: Response): Promise<T & AiApiMeta> {
  const data = await res.json();
  if (!res.ok) {
    const msg = typeof data.error === "string" ? data.error : es.errors.apiError(res.status);
    throw new Error(msg);
  }
  return data as T & AiApiMeta;
}

export async function analyzePlan(
  profile: ProfilePayload,
): Promise<FinancialPlan & AiApiMeta> {
  const res = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const data = await parseAiResponse<{ plan: FinancialPlan }>(res);
  return { ...data.plan, demoMode: data.demoMode, warning: data.warning };
}

export async function sendChatMessage(
  message: string,
  profile: ProfilePayload,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<{ reply: string; demoMode?: boolean; warning?: string }> {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      profile,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await parseAiResponse<{ reply: string }>(res);
  return { reply: data.reply, demoMode: data.demoMode, warning: data.warning };
}
