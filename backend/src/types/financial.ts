export interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amount: number; // in USDC units (not wei)
  description: string;
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  monthlyContribution: number;
}

export interface FinancialProfile {
  address: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentBalance: number;
  transactions: Transaction[];
  goals: Goal[];
  riskTolerance: "conservative" | "moderate" | "aggressive";
}

export interface AllocationPlan {
  savings: number;       // % to savings
  emergencyFund: number; // % to emergency fund
  investments: number;   // % to DeFi/investments
  expenses: number;      // % to recurring expenses
  goals: GoalAllocation[];
}

export interface GoalAllocation {
  goalId: string;
  goalName: string;
  monthlyAmount: number;
  percentOfIncome: number;
  estimatedCompletionDate: string;
}

export interface FinancialPlan {
  summary: string;
  healthScore: number; // 0-100
  diagnosis: string;
  recommendations: string[];
  allocation: AllocationPlan;
  alerts: Alert[];
  projections: MonthlyProjection[];
  smartContractActions: SmartContractAction[];
}

export interface Alert {
  level: "info" | "warning" | "critical";
  message: string;
  action?: string;
}

export interface MonthlyProjection {
  month: string;
  balance: number;
  goalProgress: number; // % of total goals reached
}

export interface SmartContractAction {
  type: "allocation_rule" | "schedule_payment" | "fund_goal";
  label: string;
  params: Record<string, unknown>;
}
