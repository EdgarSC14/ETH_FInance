import { resolveContractAddress } from "./addresses";

/** Circle testnet USDC — EIP-55 checksums (see docs/DEPLOYMENT.md). */
export const USDC_BY_CHAIN: Record<number, string> = {
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  534351: "0x2a56d0544C45A59486665a83987C65317367B901",
};

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
    smartVault: resolveContractAddress(
      process.env.NEXT_PUBLIC_VAULT_ARBITRUM_SEPOLIA,
      "0x647C771ECF69958E1E509A5bEB14363690Efe91F",
    ),
    goalManager: resolveContractAddress(
      process.env.NEXT_PUBLIC_GOAL_MANAGER_ARBITRUM_SEPOLIA,
      "0x2A1cb7E1596Cd8c7F78E748f36f466f19365eaBB",
    ),
    paymentRouter: resolveContractAddress(
      process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ARBITRUM_SEPOLIA,
      "0xC4f042E8C205735A7b0224451c4c5dD88fb78d8d",
    ),
    reputationRegistry: resolveContractAddress(
      process.env.NEXT_PUBLIC_REPUTATION_ARBITRUM_SEPOLIA,
      "0xD55d3B323D168BcFD00aB2209Cb2f4C24f411a06",
    ),
    usdc: USDC_BY_CHAIN[421614],
  },
  // Base Sepolia — fill after: pnpm --filter ethfinance-contracts deploy:base
  84532: {
    smartVault: resolveContractAddress(process.env.NEXT_PUBLIC_VAULT_BASE_SEPOLIA, ""),
    goalManager: resolveContractAddress(process.env.NEXT_PUBLIC_GOAL_MANAGER_BASE_SEPOLIA, ""),
    paymentRouter: resolveContractAddress(process.env.NEXT_PUBLIC_PAYMENT_ROUTER_BASE_SEPOLIA, ""),
    reputationRegistry: resolveContractAddress(process.env.NEXT_PUBLIC_REPUTATION_BASE_SEPOLIA, ""),
    usdc: USDC_BY_CHAIN[84532],
  },
  // Scroll Sepolia — deploy 2026-06-03
  534351: {
    smartVault: resolveContractAddress(
      process.env.NEXT_PUBLIC_VAULT_SCROLL_SEPOLIA,
      "0x95Df8D0A9Ff0fcB9D3a5778b7a72E231DAff8aC4",
    ),
    goalManager: resolveContractAddress(
      process.env.NEXT_PUBLIC_GOAL_MANAGER_SCROLL_SEPOLIA,
      "0x72704695cEE3fbF38EF68Ed5F849A6F4E468Dd33",
    ),
    paymentRouter: resolveContractAddress(
      process.env.NEXT_PUBLIC_PAYMENT_ROUTER_SCROLL_SEPOLIA,
      "0xc18d514daA63f7733850121cE02FC995197314d1",
    ),
    reputationRegistry: resolveContractAddress(
      process.env.NEXT_PUBLIC_REPUTATION_SCROLL_SEPOLIA,
      "0xa1C7142598Cbd26135544b074D4cee04ddd61002",
    ),
    usdc: USDC_BY_CHAIN[534351],
  },
  // Local Hardhat
  1337: {
    smartVault: resolveContractAddress(process.env.NEXT_PUBLIC_VAULT_LOCAL, ""),
    goalManager: resolveContractAddress(process.env.NEXT_PUBLIC_GOAL_MANAGER_LOCAL, ""),
    paymentRouter: resolveContractAddress(process.env.NEXT_PUBLIC_PAYMENT_ROUTER_LOCAL, ""),
    reputationRegistry: resolveContractAddress(process.env.NEXT_PUBLIC_REPUTATION_LOCAL, ""),
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
