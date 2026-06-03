import { describe, it, expect } from "vitest";
import { ProfileSchema, ChatRequestSchema } from "../routes/ai";

describe("ProfileSchema", () => {
  const validProfile = {
    address: "0x123",
    monthlyIncome: 4000,
    monthlyExpenses: 2000,
    currentBalance: 1500,
    transactions: [],
    goals: [],
    riskTolerance: "moderate" as const,
  };

  it("accepts valid profile", () => {
    expect(ProfileSchema.parse(validProfile)).toMatchObject(validProfile);
  });

  it("rejects negative income", () => {
    expect(() =>
      ProfileSchema.parse({ ...validProfile, monthlyIncome: -1 }),
    ).toThrow();
  });

  it("rejects invalid goal target", () => {
    expect(() =>
      ProfileSchema.parse({
        ...validProfile,
        goals: [
          {
            id: "g1",
            name: "Test",
            emoji: "🎯",
            targetAmount: 0,
            savedAmount: 0,
            deadline: "2026-01-01",
            monthlyContribution: 10,
          },
        ],
      }),
    ).toThrow();
  });
});

describe("ChatRequestSchema", () => {
  it("requires message", () => {
    expect(() => ChatRequestSchema.parse({})).toThrow();
  });

  it("accepts message with history", () => {
    const parsed = ChatRequestSchema.parse({
      message: "¿Cómo funciona la bóveda?",
      history: [{ role: "user", content: "Hola" }],
    });
    expect(parsed.message).toBe("¿Cómo funciona la bóveda?");
    expect(parsed.history).toHaveLength(1);
  });
});
