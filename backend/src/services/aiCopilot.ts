import { FinancialProfile, FinancialPlan } from "../types/financial";
import { COPILOT_SCOPE_RULES, ETHFINANCE_PROJECT_CONTEXT } from "../context/ethfinance-project";
import { llmChat } from "./llmProvider";

const PLAN_SYSTEM_PROMPT = `${COPILOT_SCOPE_RULES}

${ETHFINANCE_PROJECT_CONTEXT}

Eres el Copiloto IA de EthFinance OS. Genera un plan financiero usando SOLO capacidades del proyecto (Bóveda, metas, PaymentRouter, panel, asignación).

Devuelve ÚNICAMENTE un JSON válido con este esquema (sin texto extra):
{
  "summary": "string — resumen ejecutivo 2-3 frases en español",
  "healthScore": number (0-100),
  "diagnosis": "string",
  "recommendations": ["string", ...] (4-6 ítems accionables en la app),
  "allocation": {
    "savings": number,
    "emergencyFund": number,
    "investments": number,
    "expenses": number,
    "goals": [{ "goalId", "goalName", "monthlyAmount", "percentOfIncome", "estimatedCompletionDate" }]
  },
  "alerts": [{ "level": "info"|"warning"|"critical", "message": "string", "action": "string (opcional)" }],
  "projections": [{ "month": "YYYY-MM", "balance": number, "goalProgress": number }] (6 meses),
  "smartContractActions": [{ "type": "allocation_rule"|"schedule_payment"|"fund_goal", "label": "string", "params": {} }]
}

Las recomendaciones deben referirse a acciones reales de EthFinance OS (depósitos, reglas SmartVault, metas, pagos programados).`;

function formatProfileContext(profile: FinancialProfile): string {
  const surplus = profile.monthlyIncome - profile.monthlyExpenses;
  const savingsRate = profile.monthlyIncome > 0
    ? ((surplus / profile.monthlyIncome) * 100).toFixed(1)
    : "0";

  const riskLabels: Record<string, string> = {
    conservative: "conservador",
    moderate: "moderado",
    aggressive: "agresivo",
  };

  return `
DATOS DE LA SESIÓN EN ETHFINANCE OS:
- Wallet: ${profile.address}
- Ingresos mensuales: $${profile.monthlyIncome} USDC
- Gastos mensuales: $${profile.monthlyExpenses} USDC
- Superávit mensual: $${surplus} USDC
- Tasa de ahorro: ${savingsRate}%
- Saldo actual en app: $${profile.currentBalance} USDC
- Tolerancia al riesgo: ${riskLabels[profile.riskTolerance] ?? profile.riskTolerance}

Transacciones en sesión:
${profile.transactions.length === 0
    ? "  (ninguna)"
    : profile.transactions.map((t) =>
      `  [${t.type}] ${t.category}: $${t.amount} — ${t.description} (${t.date})`,
    ).join("\n")}

Metas en sesión:
${profile.goals.length === 0
    ? "  (ninguna)"
    : profile.goals.map((g) =>
      `  ${g.emoji} ${g.name}: $${g.savedAmount}/$${g.targetAmount} hasta ${g.deadline} (aporte $${g.monthlyContribution}/mes)`,
    ).join("\n")}
`.trim();
}

export async function generateFinancialPlan(profile: FinancialProfile): Promise<FinancialPlan> {
  const { content } = await llmChat(
    [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${formatProfileContext(profile)}\n\nGenera el plan financiero JSON para este usuario en EthFinance OS.`,
      },
    ],
    { json: true, maxTokens: 2000 },
  );

  if (!content) throw new Error("Sin respuesta del Copiloto IA");
  return JSON.parse(content) as FinancialPlan;
}

export async function chatWithCopilot(
  message: string,
  profile: FinancialProfile,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const systemContent = `${COPILOT_SCOPE_RULES}

${ETHFINANCE_PROJECT_CONTEXT}

${formatProfileContext(profile)}

Responde como Copiloto IA de EthFinance OS. Máximo 3 párrafos cortos.`;

  const messages = [
    { role: "system" as const, content: systemContent },
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user" as const, content: message },
  ];

  const { content: reply } = await llmChat(messages, { maxTokens: 600 });
  return reply || "No pude procesar tu mensaje. Inténtalo de nuevo.";
}

/** Plan local cuando no hay DEEPSEEK_API_KEY */
export function generateFallbackPlan(profile: FinancialProfile): FinancialPlan {
  const surplus = profile.monthlyIncome - profile.monthlyExpenses;
  const savingsRate = profile.monthlyIncome > 0 ? surplus / profile.monthlyIncome : 0;
  const healthScore = Math.min(100, Math.max(0, 40 + savingsRate * 100 + profile.goals.length * 5));

  const now = new Date();
  const projections = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i + 1);
    return {
      month: d.toISOString().slice(0, 7),
      balance: Math.max(0, profile.currentBalance + surplus * (i + 1)),
      goalProgress: Math.min(100, 10 * (i + 1)),
    };
  });

  return {
    summary: `En EthFinance OS registras $${profile.monthlyIncome} de ingresos y $${profile.monthlyExpenses} de gastos (superávit $${surplus}). ${surplus < 0 ? "Prioriza ajustar gastos en el Panel." : "Puedes reforzar ahorro vía Bóveda y metas."}`,
    healthScore: Math.round(healthScore),
    diagnosis: surplus < 0
      ? "Déficit en tu perfil de la app: revisa gastos en Panel y pausa metas no esenciales."
      : `Ahorro ~${(savingsRate * 100).toFixed(0)} % según datos de la sesión.`,
    recommendations: [
      "Usa Depositar en Panel para enviar USDC a la Bóveda inteligente (SmartVault)",
      "Crea metas en la sección Metas y vincúlalas a GoalManager al desplegar contratos",
      "Configura reglas de asignación automática en cada depósito (20 % ahorro sugerido)",
      "Programa pagos recurrentes en Pagos con PaymentRouter",
      surplus > 0 ? "Genera de nuevo el plan en Copiloto IA tras conectar MetaMask" : "Reduce gastos demo o conecta wallet para operar on-chain",
      "Despliega contratos locales con pnpm --filter ethfinance-contracts deploy:local",
    ],
    allocation: {
      savings: 20,
      emergencyFund: 15,
      investments: 10,
      expenses: 50,
      goals: profile.goals.map((g) => ({
        goalId: g.id,
        goalName: g.name,
        monthlyAmount: g.monthlyContribution,
        percentOfIncome: profile.monthlyIncome > 0
          ? Math.round((g.monthlyContribution / profile.monthlyIncome) * 100)
          : 0,
        estimatedCompletionDate: g.deadline,
      })),
    },
    alerts: [
      surplus < 0
        ? { level: "critical" as const, message: "Déficit en datos de la app", action: "Revisa Panel → gastos e ingresos" }
        : { level: "info" as const, message: "Flujo positivo en la sesión" },
      profile.goals.length === 0
        ? { level: "warning" as const, message: "Sin metas en EthFinance OS", action: "Abre Metas → Nueva meta" }
        : { level: "info" as const, message: `${profile.goals.length} meta(s) en la app` },
    ],
    projections,
    smartContractActions: [
      {
        type: "allocation_rule",
        label: "Regla SmartVault: 20 % ahorro al depositar",
        params: { basisPoints: 2000, label: "Ahorro automático" },
      },
      {
        type: "schedule_payment",
        label: "Programar pago recurrente en PaymentRouter",
        params: { frequency: "Monthly" },
      },
    ],
  };
}

/** Respuestas demo acotadas al proyecto (sin DeepSeek) */
export function generateProjectDemoResponse(message: string): string {
  const lower = message.toLowerCase();
  const projectKeywords =
    /ethfinance|bóveda|boveda|vault|meta|goal|panel|pago|payment|usdc|metamask|wallet|contrato|smartvault|copiloto|deposit|hardhat|router/i;
  const clearlyOffTopic = /(clima|fútbol|futbol|receta|película|pelicula|capital de|precio del bitcoin)/i;

  if (clearlyOffTopic.test(lower) && !projectKeywords.test(lower)) {
    return "Solo puedo ayudarte con EthFinance OS y tus datos en esta aplicación.";
  }

  if (lower.includes("boveda") || lower.includes("vault") || lower.includes("deposit")) {
    return "La Bóveda inteligente (SmartVault) recibe depósitos USDC desde Panel → Depositar. Puedes definir reglas de asignación en cada depósito. En demo sin wallet, el saldo se simula en la app; con MetaMask, usa ethers.js contra el contrato desplegado.";
  }
  if (lower.includes("meta") || lower.includes("goal")) {
    return "En la sección Metas creas objetivos (nombre, monto USDC, fecha, aporte mensual). On-chain, GoalManager.sol registra progreso; en demo los datos viven en Zustand hasta que conectes contratos en .env.local.";
  }
  if (lower.includes("pago") || lower.includes("payment") || lower.includes("recurrent")) {
    return "Pagos inteligentes usa PaymentRouter.sol: programas montos y frecuencia (única, diaria, semanal, mensual). La UI está en la sección Pagos; el backend no ejecuta la cadena, solo la app y tu wallet.";
  }
  if (lower.includes("contrato") || lower.includes("deploy") || lower.includes("hardhat")) {
    return "Contratos en contracts/: SmartVault, GoalManager, PaymentRouter, MockUSDC. Local: pnpm --filter ethfinance-contracts node y deploy:local. Copia direcciones a frontend/.env.local para Arbitrum/Base Sepolia.";
  }
  if (lower.includes("copiloto") || lower.includes("plan") || lower.includes("api")) {
    return "Copiloto IA llama a POST /api/ai/analyze (plan JSON) y POST /api/ai/chat (texto). Con DEEPSEEK_API_KEY en backend/.env usa DeepSeek; si no, modo demo con reglas del proyecto.";
  }
  if (lower.includes("metamask") || lower.includes("wallet") || lower.includes("conect")) {
    return "Conecta MetaMask desde el botón del nav. La app lee USDC y ETH; sin conexión funciona el tour demo con bóveda simulada. Redes: Arbitrum Sepolia, Base Sepolia o Hardhat local.";
  }
  if (lower.includes("panel") || lower.includes("dashboard") || lower.includes("salud")) {
    return "Panel muestra saldos, puntuación de salud provisional, transacciones de sesión y gráficos. La puntuación mejora al generar un plan en Copiloto IA con tus datos reales.";
  }

  return "Soy el Copiloto IA de EthFinance OS. Pregunta sobre Panel, Metas, Pagos, Bóveda, contratos, MetaMask o cómo usar la app. No respondo temas ajenos al proyecto.";
}
