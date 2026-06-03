"use client";
import { create } from "zustand";
import { Transaction, Goal, FinancialPlan, ChatMessage, ScheduledPayment } from "@/types";
import { DEMO_TRANSACTIONS, DEMO_GOALS, DEMO_PAYMENTS, DEMO_INITIAL_VAULT_USDC } from "@/lib/constants";

export type AppView = "dashboard" | "goals" | "payments" | "copilot";
export type PageMode = "landing" | "app";
export type WalletDisplayCurrency = "usdc" | "eth";

export interface AppToastState {
  message: string;
}

interface AppState {
  monthlyIncome: number;
  monthlyExpenses: number;
  vaultBalance: number;
  walletUsdcBalance: number | null;
  nativeEthBalance: number | null;
  onChainBalancesLoading: boolean;
  balanceRefreshKey: number;
  /** Bump to refetch on-chain transaction history. */
  transactionsRefreshKey: number;
  onChainTransactionsLoading: boolean;
  /** Bump to refetch GoalManager goals after create/fund. */
  goalsRefreshKey: number;
  onChainGoalsLoading: boolean;
  paymentsRefreshKey: number;
  onChainPaymentsLoading: boolean;
  reputationScore: number | null;
  onChainReputationLoading: boolean;
  reputationRefreshKey: number;
  walletDisplayCurrency: WalletDisplayCurrency;
  transactions: Transaction[];
  goals: Goal[];
  payments: ScheduledPayment[];
  riskTolerance: "conservative" | "moderate" | "aggressive";

  plan: FinancialPlan | null;
  isPlanLoading: boolean;
  chatHistory: ChatMessage[];

  pageMode: PageMode;
  activeView: AppView;
  depositModalOpen: boolean;
  withdrawModalOpen: boolean;
  mobileNavOpen: boolean;
  navSolid: boolean;
  toast: AppToastState | null;

  setVaultBalance: (balance: number) => void;
  setWalletUsdcBalance: (balance: number | null) => void;
  setNativeEthBalance: (balance: number | null) => void;
  setOnChainBalancesLoading: (loading: boolean) => void;
  bumpBalanceRefresh: () => void;
  bumpTransactionsRefresh: () => void;
  setTransactions: (transactions: Transaction[]) => void;
  setOnChainTransactionsLoading: (loading: boolean) => void;
  bumpGoalsRefresh: () => void;
  setGoals: (goals: Goal[]) => void;
  setOnChainGoalsLoading: (loading: boolean) => void;
  bumpPaymentsRefresh: () => void;
  setPayments: (payments: ScheduledPayment[]) => void;
  setOnChainPaymentsLoading: (loading: boolean) => void;
  setReputationScore: (score: number | null) => void;
  setOnChainReputationLoading: (loading: boolean) => void;
  bumpReputationRefresh: () => void;
  setWalletDisplayCurrency: (currency: WalletDisplayCurrency) => void;
  setMonthlyIncome: (income: number) => void;
  setMonthlyExpenses: (expenses: number) => void;
  setRiskTolerance: (rt: "conservative" | "moderate" | "aggressive") => void;
  setPlan: (plan: FinancialPlan | null) => void;
  setIsPlanLoading: (loading: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  bumpAllOnChainRefresh: () => void;
  setPageMode: (mode: PageMode) => void;
  setActiveView: (view: AppView) => void;
  goToLanding: () => void;
  openAppView: (view: AppView) => void;
  setDepositModalOpen: (open: boolean) => void;
  setWithdrawModalOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setNavSolid: (solid: boolean) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, update: Partial<Goal>) => void;
  addTransaction: (tx: Transaction) => void;
}

export const useAppStore = create<AppState>((set) => ({
  monthlyIncome: 4300,
  monthlyExpenses: 1885,
  vaultBalance: DEMO_INITIAL_VAULT_USDC,
  walletUsdcBalance: null,
  nativeEthBalance: null,
  onChainBalancesLoading: false,
  balanceRefreshKey: 0,
  transactionsRefreshKey: 0,
  onChainTransactionsLoading: false,
  goalsRefreshKey: 0,
  onChainGoalsLoading: false,
  paymentsRefreshKey: 0,
  onChainPaymentsLoading: false,
  reputationScore: null,
  onChainReputationLoading: false,
  reputationRefreshKey: 0,
  walletDisplayCurrency: "usdc",
  transactions: DEMO_TRANSACTIONS,
  goals: DEMO_GOALS,
  payments: DEMO_PAYMENTS,
  riskTolerance: "moderate",

  plan: null,
  isPlanLoading: false,
  chatHistory: [],

  pageMode: "landing",
  activeView: "dashboard",
  depositModalOpen: false,
  withdrawModalOpen: false,
  mobileNavOpen: false,
  navSolid: false,
  toast: null,

  setVaultBalance: (vaultBalance) => set({ vaultBalance }),
  setWalletUsdcBalance: (walletUsdcBalance) => set({ walletUsdcBalance }),
  setNativeEthBalance: (nativeEthBalance) => set({ nativeEthBalance }),
  setOnChainBalancesLoading: (onChainBalancesLoading) => set({ onChainBalancesLoading }),
  bumpBalanceRefresh: () =>
    set((s) => ({
      balanceRefreshKey: s.balanceRefreshKey + 1,
      transactionsRefreshKey: s.transactionsRefreshKey + 1,
      reputationRefreshKey: s.reputationRefreshKey + 1,
    })),
  bumpTransactionsRefresh: () => set((s) => ({ transactionsRefreshKey: s.transactionsRefreshKey + 1 })),
  setTransactions: (transactions) => set({ transactions }),
  setOnChainTransactionsLoading: (onChainTransactionsLoading) => set({ onChainTransactionsLoading }),
  bumpGoalsRefresh: () =>
    set((s) => ({
      goalsRefreshKey: s.goalsRefreshKey + 1,
      transactionsRefreshKey: s.transactionsRefreshKey + 1,
      reputationRefreshKey: s.reputationRefreshKey + 1,
    })),
  setGoals: (goals) => set({ goals }),
  setOnChainGoalsLoading: (onChainGoalsLoading) => set({ onChainGoalsLoading }),
  bumpPaymentsRefresh: () =>
    set((s) => ({
      paymentsRefreshKey: s.paymentsRefreshKey + 1,
      transactionsRefreshKey: s.transactionsRefreshKey + 1,
      reputationRefreshKey: s.reputationRefreshKey + 1,
    })),
  setPayments: (payments) => set({ payments }),
  setOnChainPaymentsLoading: (onChainPaymentsLoading) => set({ onChainPaymentsLoading }),
  setReputationScore: (reputationScore) => set({ reputationScore }),
  setOnChainReputationLoading: (onChainReputationLoading) => set({ onChainReputationLoading }),
  bumpReputationRefresh: () => set((s) => ({ reputationRefreshKey: s.reputationRefreshKey + 1 })),
  setWalletDisplayCurrency: (walletDisplayCurrency) => set({ walletDisplayCurrency }),
  setMonthlyIncome: (monthlyIncome) => set({ monthlyIncome }),
  setMonthlyExpenses: (monthlyExpenses) => set({ monthlyExpenses }),
  setRiskTolerance: (riskTolerance) => set({ riskTolerance }),
  setPlan: (plan) => set({ plan }),
  setIsPlanLoading: (isPlanLoading) => set({ isPlanLoading }),
  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChatHistory: () => set({ chatHistory: [] }),
  showToast: (message) => set({ toast: { message } }),
  dismissToast: () => set({ toast: null }),
  bumpAllOnChainRefresh: () =>
    set((s) => ({
      balanceRefreshKey: s.balanceRefreshKey + 1,
      goalsRefreshKey: s.goalsRefreshKey + 1,
      paymentsRefreshKey: s.paymentsRefreshKey + 1,
      transactionsRefreshKey: s.transactionsRefreshKey + 1,
      reputationRefreshKey: s.reputationRefreshKey + 1,
    })),
  setPageMode: (pageMode) => set({ pageMode }),
  setActiveView: (activeView) => set({ activeView }),
  goToLanding: () => set({ pageMode: "landing", navSolid: false }),
  openAppView: (activeView) => set({ pageMode: "app", activeView, navSolid: true }),
  setDepositModalOpen: (depositModalOpen) => set({ depositModalOpen }),
  setWithdrawModalOpen: (withdrawModalOpen) => set({ withdrawModalOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setNavSolid: (navSolid) => set({ navSolid }),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  updateGoal: (id, update) =>
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...update } : g)) })),
  addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
}));
