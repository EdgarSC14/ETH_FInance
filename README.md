# EthFinance OS — AI Financial Layer · Smart Web3 Account

> A decentralized, AI-powered financial account combining Ethereum smart contracts, USDC stablecoins, and an intelligent Financial Copilot — built for hackathons and real-world deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│          MetaMask ←→ Next.js Frontend (Port 3000)               │
└──────────────────────┬──────────────────────┬───────────────────┘
                       │ REST API             │ ethers.js / JSON-RPC
                       ▼                      ▼
        ┌──────────────────────┐   ┌─────────────────────────────┐
        │   AI Backend         │   │   Ethereum L2               │
        │   Node.js (Port 3001)│   │   (Arbitrum / Base)         │
        │                      │   │                             │
        │  ┌────────────────┐  │   │  ┌──────────────────────┐  │
        │  │ DeepSeek / Groq  │  │   │  │ SmartVault.sol       │  │
        │  │ Financial Plan   │  │   │  │ GoalManager.sol      │  │
        │  │ Chat Copilot     │  │   │  │ PaymentRouter.sol    │  │
        │  └────────────────┘  │   │  └──────────────────────┘  │
        └──────────────────────┘   └─────────────────────────────┘
```

## Project Structure

```
EthFinance OS/
├── frontend/              # Next.js 16 · TypeScript · Tailwind v4 · Framer Motion
│   ├── src/
│   │   ├── app/           # App Router pages + global CSS
│   │   ├── components/
│   │   │   ├── ui/        # GlassCard, Button, Badge, ProgressRing, AnimatedNumber
│   │   │   ├── dashboard/ # BalanceCard, HealthScoreCard, AllocationChart, TransactionFeed, DepositModal
│   │   │   ├── goals/     # GoalsPanel (create, track, fund)
│   │   │   ├── copilot/   # AICopilot (chat + plan display)
│   │   │   └── payments/  # PaymentsPanel (schedule recurring txs)
│   │   ├── hooks/
│   │   │   ├── useWallet.ts   # MetaMask connection, network switching
│   │   │   └── useVault.ts    # SmartVault interactions via ethers.js
│   │   ├── lib/
│   │   │   ├── api.ts         # Backend REST client
│   │   │   ├── constants.ts   # Contract addresses, demo data, colors
│   │   │   └── utils.ts       # Formatting, math helpers
│   │   ├── store/
│   │   │   └── useAppStore.ts # Zustand global state
│   │   └── types/index.ts     # Shared TypeScript types
│   └── .env.local.example
│
├── contracts/             # Hardhat · Solidity 0.8.24 · OpenZeppelin v5
│   ├── src/
│   │   ├── SmartVault.sol     # Core vault: deposits, withdrawals, allocation rules
│   │   ├── GoalManager.sol    # Goal creation, funding, tracking
│   │   ├── PaymentRouter.sol  # Rule-based recurring payments + time-lock
│   │   └── MockUSDC.sol       # ERC20 test token (6 decimals)
│   ├── scripts/deploy.ts      # Full deployment script
│   ├── test/SmartVault.test.ts
│   └── hardhat.config.ts
│
└── backend/               # Node.js · Express · DeepSeek / Groq / Gemini
    ├── src/
    │   ├── index.ts           # Express server (port 3001)
    │   ├── routes/ai.ts       # /api/ai/analyze + /api/ai/chat
    │   ├── services/aiCopilot.ts  # LLM integration + fallback
    │   └── types/financial.ts # Shared types
    └── .env.example
```

---

## Inicio rápido (equipo)

### Requisitos
- Node.js 20+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@10.12.1 --activate`)
- Extensión MetaMask en el navegador
- (Opcional) `DEEPSEEK_API_KEY` en `backend/.env` para Copiloto IA en vivo (modo demo funciona sin ella)

### Flujo único de onboarding

```bash
git clone git@github.com:pazvicda/EthFinance_OS.git
cd EthFinance_OS
pnpm install

cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env   # DEEPSEEK_API_KEY opcional

pnpm run dev:all
# → Frontend http://localhost:3000
```

### Qué hace cada servicio en `dev:all`

| Servicio | Puerto | Función |
|----------|--------|---------|
| Hardhat node | 8545 | Cadena local Ethereum + contratos desplegables |
| Backend Express | 3001 | `POST /api/ai/analyze`, `POST /api/ai/chat` (Copiloto IA) |
| Frontend Next.js | 3000 | UI en español, MetaMask, panel/metas/pagos/copiloto |

Alternativa sin Hardhat local:

```bash
pnpm dev   # solo frontend (3000) + backend (3001)
```

### MetaMask + Arbitrum Sepolia

1. Añade la red **Arbitrum Sepolia** (Chain ID `421614`).
2. Obtén **ETH** para gas: [QuickNode Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia).
3. Obtén **USDC** de prueba: [Circle Faucet](https://faucet.circle.com/) — selecciona **Arbitrum Sepolia**.
4. Las direcciones del equipo ya están en [`frontend/.env.local.example`](frontend/.env.local.example).

| Contrato | Dirección (Arbitrum Sepolia) |
|----------|------------------------------|
| USDC (Circle) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| SmartVault | `0x33897e8f04D03f53b1F5530aB95A05391D4b59b1` |
| GoalManager | `0xeA2Fd4d213b5310968B328c84c6A22a4D721E0FA` |
| PaymentRouter | `0x9319Ed6E0eb84C1eF34A991998e24d495c14Cb0D` |

### Modo demo vs on-chain

- **Modo demo** (sin MetaMask): badge ámbar en el nav; datos simulados.
- **On-chain** (MetaMask conectada): badge verde; depósitos, metas y pagos son transacciones reales.

### Seguridad de claves

- **Nunca** subas `backend/.env`, `frontend/.env.local` ni `contracts/.env`.
- En git, `backend/.env.example` usa `your-key-here` — no pegues claves reales ahí.
- Si una clave se expuso, rótala en el panel de DeepSeek/Groq/Gemini.

### Nota sobre hidratación

El atributo `bis_skin_checked` en consola proviene de extensiones de antivirus (p. ej. Bitdefender), no de la app. En producción no debería aparecer.

---

## Quick Start (English summary)

```bash
pnpm install
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
pnpm run dev:all
```

Connect MetaMask to Arbitrum Sepolia (421614). See contract addresses in `frontend/.env.local.example`.

---

## Quick Start (legacy)

### Smart Contracts (local)

```bash
pnpm --filter ethfinance-contracts node          # Start local Hardhat node
pnpm --filter ethfinance-contracts deploy:local  # Deploy to localhost
```

### Deploy to Arbitrum Sepolia

```bash
cp contracts/.env.example contracts/.env
# Fill in DEPLOYER_PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC
pnpm --filter ethfinance-contracts deploy:arbitrum
# Copy contract addresses into frontend/.env.local
```

### Multi-chain production (Vercel + Scroll / Arbitrum / …)

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for env vars per chain, EIP-55 checksums, redeploy rules, and troubleshooting.

```bash
pnpm verify:addresses   # validar checksums USDC + contratos baked-in
```

### Useful commands

| Command | Description |
|---|---|
| `pnpm install` | Install all monorepo dependencies |
| `pnpm verify:addresses` | Check EIP-55 checksums for USDC and default contract addresses |
| `pnpm dev` | Run frontend + backend in parallel |
| `pnpm dev:frontend` | Start Next.js dev server |
| `pnpm dev:backend` | Start AI backend |
| `pnpm build:frontend` | Production build for frontend |
| `pnpm build:contracts` | Compile Solidity contracts |
| `pnpm test:contracts` | Run Hardhat tests |

---

## Testing with your own wallet (team)

Everyone can use the **same deployed contracts** on Arbitrum Sepolia. Each person uses their **own MetaMask wallet**.

### 1. Clone and run

```bash
git clone git@github.com:pazvicda/EthFinance_OS.git
cd EthFinance_OS
corepack enable && corepack prepare pnpm@10.12.1 --activate
pnpm install

cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env

pnpm dev
# → http://localhost:3000
```

The `.env.local.example` already includes the team contract addresses on **Arbitrum Sepolia**. You can also skip this step on branch `Victor` — those addresses are baked in as defaults.

### Quick start (branch Victor)

```bash
git fetch origin
git checkout Victor
pnpm install
cp backend/.env.example backend/.env   # optional DeepSeek key
pnpm dev
```

Connect MetaMask to **Arbitrum Sepolia** (chain ID `421614`).

### 2. MetaMask setup

1. Add network **Arbitrum Sepolia** (chain ID `421614`)
2. Get **ETH** for gas (Arbitrum Sepolia faucet)
3. Get **USDC** testnet from [faucet.circle.com](https://faucet.circle.com/) — select **Arbitrum Sepolia** (not Ethereum Sepolia)

### 3. What you can test

| Feature | Where |
|---|---|
| Deposit / Withdraw USDC | Dashboard |
| Create & fund goals on-chain | Financial Goals |
| Schedule & execute payments | Smart Payments (execute uses **vault** balance) |
| AI Copilot | AI Copilot (works without DeepSeek key in demo mode) |

### 4. Important notes

- **Do not commit** `frontend/.env.local`, `backend/.env`, or `contracts/.env` (private keys).
- Payments **Execute** pulls USDC from your **Smart Vault** — deposit first.
- Goals can be funded from **vault** or **wallet USDC**.
- Invite collaborators on GitHub: repo **Settings → Collaborators → Add people**.

### Shared contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| USDC (Circle) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| SmartVault | `0x33897e8f04D03f53b1F5530aB95A05391D4b59b1` |
| GoalManager | `0xeA2Fd4d213b5310968B328c84c6A22a4D721E0FA` |
| PaymentRouter | `0x9319Ed6E0eb84C1eF34A991998e24d495c14Cb0D` |

---

## Smart Contracts

| Contract | Description |
|---|---|
| `SmartVault` | Core vault — USDC deposits, withdrawals, allocation rules on every deposit |
| `GoalManager` | On-chain goals with target amount, deadline, progress tracking |
| `PaymentRouter` | Recurring scheduled payments with time-lock safety |
| `MockUSDC` | Test ERC20 with 6 decimals for local/testnet development |

**Security features:** `ReentrancyGuard`, `Ownable`, `SafeERC20`, basis-points allocation validation, time-lock on payment cancellation.

---

## AI Financial Copilot

The backend exposes two AI endpoints:

- `POST /api/ai/analyze` — Full financial plan generation (DeepSeek → Groq → Gemini)
- `POST /api/ai/chat` — Conversational financial advisor

**Demo mode** (no API key): Returns intelligent rule-based fallback responses — fully functional for hackathon demos.

---

## UX Features

- **Glassmorphism** UI with depth and layering
- **Framer Motion** animations: mount, state transitions, staggered lists, progress rings
- **AnimatedNumber** component: smooth count-up on value changes
- **ProgressRing** with SVG stroke animation
- **DepositModal** with multi-step flow (input → confirm → success/error)
- **Live Recharts** — animated pie chart for allocation + area chart for projections
- **Zustand** global state — no prop drilling
- **Demo mode** — fully functional without wallet or backend connection

---

## Networks

| Network | Chain ID | Status |
|---|---|---|
| Arbitrum Sepolia | 421614 | Testnet — Recommended |
| Base Sepolia | 84532 | Testnet — Supported |
| Arbitrum One | 42161 | Mainnet — Production-ready |
| Base | 8453 | Mainnet — Production-ready |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Zustand |
| Web3 | ethers.js v6, MetaMask EIP-1193 |
| Smart Contracts | Solidity 0.8.24, OpenZeppelin v5, Hardhat |
| AI Backend | Node.js, Express, DeepSeek/Groq/Gemini, Zod |

---

*Built as a Web3 startup — production-grade architecture, hackathon speed.*
