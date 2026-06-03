import { describe, it, expect } from "vitest";
import {
  deriveFinancialMetrics,
  getOnChainTransactions,
  computeHealthScore,
  buildOnChainAllocation,
} from "./financialMetrics";
import { Goal, Transaction } from "@/types";

const demoGoals: Goal[] = [
  {
    id: "demo-1",
    name: "Vacaciones",
    emoji: "🏖",
    targetAmount: 1000,
    savedAmount: 200,
    deadline: "2026-12-31",
    monthlyContribution: 100,
    status: "active",
  },
];

const chainTx: Transaction[] = [
  {
    id: "chain-vault-dep-1",
    type: "income",
    category: "Bóveda",
    amount: 500,
    description: "Depósito",
    date: new Date().toISOString().slice(0, 10),
    hash: "0xabc",
  },
  {
    id: "chain-goal-1",
    type: "expense",
    category: "Meta",
    amount: 50,
    description: "Meta",
    date: new Date().toISOString().slice(0, 10),
    hash: "0xdef",
  },
  {
    id: "demo-tx",
    type: "income",
    category: "Demo",
    amount: 999,
    description: "No on-chain",
    date: "2020-01-01",
  },
];

describe("getOnChainTransactions", () => {
  it("filters chain- prefix and hash txs", () => {
    const result = getOnChainTransactions(chainTx);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.id.startsWith("chain-") || t.hash)).toBe(true);
  });
});

describe("deriveFinancialMetrics", () => {
  it("returns demo metrics when disconnected", () => {
    const m = deriveFinancialMetrics(false, chainTx, 1000, null, demoGoals, 4300, 1885);
    expect(m.source).toBe("demo");
    expect(m.income).toBe(4300);
    expect(m.expenses).toBe(1885);
    expect(m.totalUsdc).toBe(1000);
  });

  it("returns onchain metrics when connected", () => {
    const m = deriveFinancialMetrics(true, chainTx, 800, 200, demoGoals, 4300, 1885);
    expect(m.source).toBe("onchain");
    expect(m.totalUsdc).toBe(800 + 200 + 200);
    expect(m.income).toBeGreaterThan(0);
  });
});

describe("computeHealthScore", () => {
  it("uses plan score when provided", () => {
    const metrics = deriveFinancialMetrics(false, [], 1000, null, [], 4000, 2000);
    expect(computeHealthScore(metrics, [], 88)).toBe(88);
  });
});

describe("buildOnChainAllocation", () => {
  it("builds slices for wallet, vault, goals and spent", () => {
    const slices = buildOnChainAllocation(100, 500, 200, chainTx, {
      wallet: "Cartera",
      vault: "Bóveda",
      goals: "Metas",
      spent: "Gastado",
    });
    expect(slices.find((s) => s.name === "Bóveda")?.value).toBe(500);
    expect(slices.find((s) => s.name === "Gastado")?.value).toBe(50);
  });
});
