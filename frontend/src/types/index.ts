export interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amount: number;
  description: string;
  date: string;
  hash?: string;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  monthlyContribution: number;
  status: "active" | "completed" | "cancelled";
}

export type PaymentFrequency = "OneTime" | "Daily" | "Weekly" | "Monthly";

export interface ScheduledPayment {
  id: string;
  recipient: string;
  recipientLabel: string;
  amount: number;
  frequency: PaymentFrequency;
  nextDate: string;
  label: string;
  active: boolean;
  executionCount: number;
  /** Unix seconds — cancel allowed after this time (on-chain). */
  timeLockEnd?: number;
  isDue?: boolean;
  canCancel?: boolean;
}

export interface AllocationRule {
  id: string;
  label: string;
  basisPoints: number;
  destination: string;
  active: boolean;
}

export interface FinancialPlan {
  summary: string;
  healthScore: number;
  diagnosis: string;
  recommendations: string[];
  allocation: {
    savings: number;
    emergencyFund: number;
    investments: number;
    expenses: number;
    goals: Array<{
      goalId: string;
      goalName: string;
      monthlyAmount: number;
      percentOfIncome: number;
      estimatedCompletionDate: string;
    }>;
  };
  alerts: Array<{
    level: "info" | "warning" | "critical";
    message: string;
    action?: string;
  }>;
  projections: Array<{
    month: string;
    balance: number;
    goalProgress: number;
  }>;
  smartContractActions: Array<{
    type: string;
    label: string;
    params: Record<string, unknown>;
  }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type NetworkId = 42161 | 8453 | 421614 | 84532 | 1337;
