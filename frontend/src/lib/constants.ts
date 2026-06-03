export const CONTRACT_ADDRESSES: Record<
  number,
  {
    smartVault: string;
    goalManager: string;
    paymentRouter: string;
    reputationRegistry: string;
    usdc: string;
  }
> = {
  // Arbitrum Sepolia — deploy 2026-05-30 (Victor)
  421614: {
    smartVault: process.env.NEXT_PUBLIC_VAULT_ARBITRUM_SEPOLIA || "0x647C771ECF69958E1E509A5bEB14363690Efe91F",
    goalManager: process.env.NEXT_PUBLIC_GOAL_MANAGER_ARBITRUM_SEPOLIA || "0x2A1cb7E1596Cd8c7F78E748f36f466f19365eaBB",
    paymentRouter: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ARBITRUM_SEPOLIA || "0xC4f042E8C205735A7b0224451c4c5dD88fb78d8d",
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_ARBITRUM_SEPOLIA || "0xD55d3B323D168BcFD00aB2209Cb2f4C24f411a06",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  },
  // Base Sepolia — fill after: pnpm --filter ethfinance-contracts deploy:base
  84532: {
    smartVault: process.env.NEXT_PUBLIC_VAULT_BASE_SEPOLIA || "",
    goalManager: process.env.NEXT_PUBLIC_GOAL_MANAGER_BASE_SEPOLIA || "",
    paymentRouter: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_BASE_SEPOLIA || "",
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_BASE_SEPOLIA || "",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  // Scroll Sepolia
  534351: {
    smartVault: process.env.NEXT_PUBLIC_VAULT_SCROLL_SEPOLIA || "",
    goalManager: process.env.NEXT_PUBLIC_GOAL_MANAGER_SCROLL_SEPOLIA || "",
    paymentRouter: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_SCROLL_SEPOLIA || "",
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_SCROLL_SEPOLIA || "",
    usdc: "0x2a56D0544c45a59486665a83987c65317367b901",
  },
  // Optimism Sepolia
  11155420: {
    smartVault: process.env.NEXT_PUBLIC_VAULT_OPTIMISM_SEPOLIA || "",
    goalManager: process.env.NEXT_PUBLIC_GOAL_MANAGER_OPTIMISM_SEPOLIA || "",
    paymentRouter: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_OPTIMISM_SEPOLIA || "",
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_OPTIMISM_SEPOLIA || "",
    usdc: "0x5fd84259d06603F7AA9162260a644da2997f813A",
  },
  // Local Hardhat
  1337: {
    smartVault: process.env.NEXT_PUBLIC_VAULT_LOCAL || "",
    goalManager: process.env.NEXT_PUBLIC_GOAL_MANAGER_LOCAL || "",
    paymentRouter: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_LOCAL || "",
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_LOCAL || "",
    usdc: "",
  },
};

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

/** Vault balance shown when wallet is disconnected (demo tour). */
export const DEMO_INITIAL_VAULT_USDC = 500;

export const DEMO_TRANSACTIONS = [
  { id: "1", type: "income" as const, category: "Salario", amount: 3500, description: "Salario mensual", date: "2026-05-01" },
  { id: "2", type: "expense" as const, category: "Vivienda", amount: 1200, description: "Alquiler mensual", date: "2026-05-02" },
  { id: "3", type: "expense" as const, category: "Comida", amount: 320, description: "Supermercado y restaurantes", date: "2026-05-03" },
  { id: "4", type: "expense" as const, category: "Transporte", amount: 180, description: "Combustible y movilidad", date: "2026-05-05" },
  { id: "5", type: "income" as const, category: "Freelance", amount: 800, description: "Proyecto de diseño", date: "2026-05-08" },
  { id: "6", type: "expense" as const, category: "Suscripciones", amount: 65, description: "Streaming y software", date: "2026-05-09" },
  { id: "7", type: "transfer" as const, category: "Ahorro", amount: 500, description: "Aporte a fondo de emergencia", date: "2026-05-10" },
  { id: "8", type: "expense" as const, category: "Servicios", amount: 120, description: "Luz e internet", date: "2026-05-12" },
];

export const DEMO_GOALS = [
  { id: "0", name: "Fondo de emergencia", emoji: "🛡️", targetAmount: 10000, savedAmount: 3200, deadline: "2026-12-31", monthlyContribution: 500, status: "active" as const },
  { id: "1", name: "MacBook Pro", emoji: "💻", targetAmount: 2500, savedAmount: 1800, deadline: "2026-08-01", monthlyContribution: 350, status: "active" as const },
  { id: "2", name: "Viaje a Europa", emoji: "✈️", targetAmount: 5000, savedAmount: 800, deadline: "2027-06-01", monthlyContribution: 200, status: "active" as const },
];

export const DEMO_PAYMENTS = [
  { id: "demo-1", recipient: "0xABCD000000000000000000000000000000000001", recipientLabel: "Arrendador", amount: 1200, frequency: "Monthly" as const, nextDate: "2026-06-01", label: "Alquiler", active: true, executionCount: 3 },
  { id: "demo-2", recipient: "0x1234567890123456789012345678901234567890", recipientLabel: "Bóveda de ahorro", amount: 500, frequency: "Monthly" as const, nextDate: "2026-06-01", label: "Ahorro automático", active: true, executionCount: 2 },
  { id: "demo-3", recipient: "0xDEAD0000000000000000000000000000000000BEEF", recipientLabel: "Seguro", amount: 85, frequency: "Monthly" as const, nextDate: "2026-06-15", label: "Seguro de salud", active: true, executionCount: 5 },
];

export const COLORS = {
  primary: "#10b981",
  secondary: "#34d399",
  accent: "#6ee7b7",
  success: "#10b981",
  warning: "#fbbf24",
  danger: "#f87171",
  muted: "#64748b",
  chart: ["#10b981", "#34d399", "#6ee7b7", "#94a3b8", "#fbbf24"],
};
