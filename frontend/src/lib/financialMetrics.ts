import { Goal, Transaction } from "@/types";
import { percentOf } from "@/lib/utils";

export type MetricsSource = "demo" | "onchain";

export interface DerivedFinancialMetrics {
  source: MetricsSource;
  income: number;
  expenses: number;
  totalUsdc: number;
  goalsSaved: number;
  monthlySurplus: number;
  savingsRate: number;
}

export interface AllocationSlice {
  name: string;
  value: number;
  isPercent: false;
}

/** On-chain txs only (from contract event sync or signed txs with hash). */
export function getOnChainTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.id.startsWith("chain-") || !!t.hash);
}

function isRecentMonth(dateStr: string, ref = new Date()): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function sumByType(txs: Transaction[], type: Transaction["type"]): number {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

export function deriveFinancialMetrics(
  isConnected: boolean,
  transactions: Transaction[],
  vaultBalance: number,
  walletUsdc: number | null,
  goals: Goal[],
  demoIncome: number,
  demoExpenses: number,
): DerivedFinancialMetrics {
  const wallet = walletUsdc ?? 0;
  const goalsSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalUsdc = wallet + vaultBalance + goalsSaved;

  if (!isConnected) {
    const monthlySurplus = demoIncome - demoExpenses;
    return {
      source: "demo",
      income: demoIncome,
      expenses: demoExpenses,
      totalUsdc: vaultBalance,
      goalsSaved,
      monthlySurplus,
      savingsRate: demoIncome > 0 ? monthlySurplus / demoIncome : 0,
    };
  }

  const chainTxs = getOnChainTransactions(transactions);
  const monthTxs = chainTxs.filter((t) => isRecentMonth(t.date));
  const scopedTxs = monthTxs.length > 0 ? monthTxs : chainTxs;

  const income = sumByType(scopedTxs, "income");
  const expenses = sumByType(scopedTxs, "expense");

  const goalsMonthly = goals.reduce((s, g) => s + g.monthlyContribution, 0);
  const derivedIncome = income > 0 ? income : totalUsdc > 0 ? totalUsdc : goalsMonthly;
  const derivedExpenses = expenses;

  const monthlySurplus = derivedIncome - derivedExpenses;

  return {
    source: "onchain",
    income: derivedIncome,
    expenses: derivedExpenses,
    totalUsdc,
    goalsSaved,
    monthlySurplus,
    savingsRate: derivedIncome > 0 ? monthlySurplus / derivedIncome : 0,
  };
}

export function computeHealthScore(
  metrics: DerivedFinancialMetrics,
  goals: Goal[],
  planScore?: number,
): number {
  if (planScore != null) return planScore;

  if (metrics.source === "demo") {
    return metrics.income > 0
      ? Math.round(Math.min(100, Math.max(0, 40 + metrics.savingsRate * 60)))
      : 50;
  }

  let score = 45;
  score += Math.min(30, metrics.savingsRate * 100 * 0.35);
  score += Math.min(20, Math.log10(Math.max(metrics.totalUsdc, 1) + 1) * 8);

  const activeGoals = goals.filter((g) => g.status === "active");
  if (activeGoals.length > 0) {
    const avgProgress =
      activeGoals.reduce((s, g) => s + percentOf(g.savedAmount, g.targetAmount), 0) / activeGoals.length;
    score += avgProgress * 0.12;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function buildOnChainAllocation(
  walletUsdc: number,
  vaultBalance: number,
  goalsSaved: number,
  transactions: Transaction[],
  labels: { wallet: string; vault: string; goals: string; spent: string },
): AllocationSlice[] {
  const spent = getOnChainTransactions(transactions)
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const slices: AllocationSlice[] = [
    { name: labels.wallet, value: walletUsdc, isPercent: false },
    { name: labels.vault, value: vaultBalance, isPercent: false },
    { name: labels.goals, value: goalsSaved, isPercent: false },
  ];

  if (spent > 0) {
    slices.push({ name: labels.spent, value: spent, isPercent: false });
  }

  return slices.filter((d) => d.value > 0.001);
}

export function buildBalanceProjection(
  startBalance: number,
  monthlySurplus: number,
  months = 6,
): Array<{ month: string; balance: number }> {
  const data: Array<{ month: string; balance: number }> = [];
  let balance = startBalance;
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    data.push({
      month: d.toISOString().slice(0, 7),
      balance: Math.round(balance * 100) / 100,
    });
    balance += monthlySurplus;
  }

  return data;
}
