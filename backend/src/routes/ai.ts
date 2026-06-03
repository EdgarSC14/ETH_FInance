import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  generateFinancialPlan,
  chatWithCopilot,
  generateFallbackPlan,
  generateProjectDemoResponse,
} from "../services/aiCopilot";
import { isAnyLlmConfigured } from "../services/llmProvider";
import { FinancialProfile } from "../types/financial";

const router = Router();

export const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string(),
  amount: z.number().min(0),
  description: z.string(),
  date: z.string(),
});

export const GoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  targetAmount: z.number().positive(),
  savedAmount: z.number().min(0),
  deadline: z.string(),
  monthlyContribution: z.number().min(0),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});

export const ProfileSchema = z.object({
  address: z.string(),
  monthlyIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  currentBalance: z.number().min(0),
  transactions: z.array(TransactionSchema).default([]),
  goals: z.array(GoalSchema).default([]),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  profile: ProfileSchema.optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .default([]),
});

function llmWarning(err: unknown): string | undefined {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("402") || /insufficient balance/i.test(msg)) {
    return "DeepSeek sin créditos (402). Respuesta en modo demo del proyecto.";
  }
  if (msg.includes("401") || /invalid.*api.*key/i.test(msg)) {
    return "API key inválida. Respuesta en modo demo.";
  }
  return "Proveedor LLM no disponible. Respuesta en modo demo del proyecto.";
}

router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const profile = ProfileSchema.parse(req.body) as FinancialProfile;

    if (!isAnyLlmConfigured()) {
      const plan = generateFallbackPlan(profile);
      return res.json({
        success: true,
        plan,
        demoMode: true,
        warning: "Sin API keys LLM; plan generado en modo demo.",
        generatedAt: new Date().toISOString(),
      });
    }

    try {
      const plan = await generateFinancialPlan(profile);
      return res.json({ success: true, plan, demoMode: false, generatedAt: new Date().toISOString() });
    } catch (apiErr) {
      console.warn("[AI Analyze] LLM falló:", apiErr);
      const plan = generateFallbackPlan(profile);
      return res.json({
        success: true,
        plan,
        demoMode: true,
        warning: llmWarning(apiErr),
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Datos de perfil inválidos", details: err.flatten() });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI Analyze]", message);
    res.status(400).json({ success: false, error: message });
  }
});

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const parsed = ChatRequestSchema.parse(req.body);
    const { message, history } = parsed;
    const parsedProfile = (parsed.profile ?? {
      address: "0x0000",
      monthlyIncome: 0,
      monthlyExpenses: 0,
      currentBalance: 0,
      transactions: [],
      goals: [],
      riskTolerance: "moderate",
    }) as FinancialProfile;

    if (!isAnyLlmConfigured()) {
      return res.json({
        success: true,
        reply: generateProjectDemoResponse(message),
        demoMode: true,
        warning: "Sin API keys LLM; modo demo.",
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const reply = await chatWithCopilot(message, parsedProfile, history);
      return res.json({ success: true, reply, demoMode: false, timestamp: new Date().toISOString() });
    } catch (apiErr) {
      console.warn("[AI Chat] LLM falló:", apiErr);
      return res.json({
        success: true,
        reply: generateProjectDemoResponse(message),
        demoMode: true,
        warning: llmWarning(apiErr),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Datos de solicitud inválidos", details: err.flatten() });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
});

export default router;
