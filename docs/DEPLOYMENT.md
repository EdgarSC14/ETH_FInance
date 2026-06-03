# EthFinance OS — Guía de despliegue multi-chain en producción

Esta guía explica cómo la app detecta red y USDC, cómo activar una red con contratos ya desplegados en Vercel (u otro hosting), variables de entorno, checksum EIP-55 y troubleshooting.

## 1. Cómo detecta la app la red y la moneda

No hace falta código nuevo al agregar una red ya soportada. Flujo:

1. MetaMask conecta → `useWallet.ts` lee `chainId`.
2. Hooks on-chain (`useVault`, `useGoalManager`, `usePaymentRouter`, …) usan `CONTRACT_ADDRESSES[chainId]`.
3. `CONTRACT_ADDRESSES` está en `frontend/src/lib/constants.ts` (direcciones con checksum EIP-55; env vars se normalizan vía `frontend/src/lib/addresses.ts`).
4. Metadata de red (nombre, RPC, explorador) en `frontend/src/lib/chains.ts` → `SUPPORTED_CHAINS`.

Si falta alguno de los contratos EthFinance para esa red, la app muestra: *"USDC disponible en esta red, pero faltan contratos EthFinance desplegados."*

## 2. Activar Scroll (u otra red) en producción

Tras desplegar contratos (p. ej. `pnpm --filter ethfinance-contracts deploy:scroll`):

1. **Push** del código con defaults y fix de checksum.
2. **Vercel** → Settings → Environment Variables → añade las 4 `NEXT_PUBLIC_*` de la red (Production, Preview, Development).
3. **Redeploy** obligatorio: Next.js inyecta `NEXT_PUBLIC_*` en **build time**.
4. Usuario cambia MetaMask a esa red; la app usa USDC + contratos de ese `chainId`.

Sin redeploy tras cambiar env vars, el bundle sigue viejo y verás "faltan contratos desplegados".

## 3. Variables de entorno por red (Vercel / hosting)

Copia las 4 líneas que imprime el script al final de `deploy:<red>`.

### Scroll Sepolia (534351) — desplegado 2026-06-03

```env
NEXT_PUBLIC_VAULT_SCROLL_SEPOLIA=0x95Df8D0A9Ff0fcB9D3a5778b7a72E231DAff8aC4
NEXT_PUBLIC_GOAL_MANAGER_SCROLL_SEPOLIA=0x72704695cEE3fbF38EF68Ed5F849A6F4E468Dd33
NEXT_PUBLIC_PAYMENT_ROUTER_SCROLL_SEPOLIA=0xc18d514daA63f7733850121cE02FC995197314d1
NEXT_PUBLIC_REPUTATION_SCROLL_SEPOLIA=0xa1C7142598Cbd26135544b074D4cee04ddd61002
```

*(Opcional en Vercel si ya están en `constants.ts` como defaults.)*

### Arbitrum Sepolia (421614) — defaults en código

```env
NEXT_PUBLIC_VAULT_ARBITRUM_SEPOLIA=0x647C771ECF69958E1E509A5bEB14363690Efe91F
NEXT_PUBLIC_GOAL_MANAGER_ARBITRUM_SEPOLIA=0x2A1cb7E1596Cd8c7F78E748f36f466f19365eaBB
NEXT_PUBLIC_PAYMENT_ROUTER_ARBITRUM_SEPOLIA=0xC4f042E8C205735A7b0224451c4c5dD88fb78d8d
NEXT_PUBLIC_REPUTATION_ARBITRUM_SEPOLIA=0xD55d3B323D168BcFD00aB2209Cb2f4C24f411a06
```

### Base Sepolia

Rellena tras `deploy:base` (ver salida del script).

### Backend + frontend (Vercel Services)

```env
NEXT_PUBLIC_BACKEND_URL=/_/backend
DEEPSEEK_API_KEY=sk-...
FRONTEND_URL=https://tu-dominio.vercel.app
```

## 4. USDC oficial por red (referencia)

| Red | Chain ID | USDC (EIP-55) |
|-----|----------|----------------|
| Arbitrum Sepolia | 421614 | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| Base Sepolia | 84532 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Scroll Sepolia | 534351 | `0x2a56d0544C45A59486665a83987C65317367B901` |

Fuente: [Circle Faucet](https://faucet.circle.com/).

## 5. Checksum EIP-55 (`bad address checksum`)

**Síntoma:** `TypeError: bad address checksum` al depositar o desplegar.

**Causa:** ethers v6 exige casing EIP-55 correcto en direcciones.

**Fix en repo:**

- `frontend/src/lib/constants.ts` + `frontend/src/lib/addresses.ts`
- `contracts/scripts/networks.ts` + `contracts/scripts/checksum.ts`

**Verificar todo el repo:**

```bash
pnpm verify:addresses
```

**Regla:** copia direcciones del explorer o normaliza con `ethers.getAddress(addr.toLowerCase())`.

## 6. Flujo operativo (nueva red)

1. Gas en wallet deployer (faucets por red en README).
2. `contracts/.env` con `DEPLOYER_PRIVATE_KEY` (nunca commit).
3. `pnpm --filter ethfinance-contracts deploy:<red>`
4. Copiar 4 líneas `NEXT_PUBLIC_*` → `frontend/.env.local` (local) o Vercel (prod).
5. Redeploy frontend en prod; reiniciar `pnpm dev` en local.
6. MetaMask en la red → badge verde → depósito USDC de esa red en faucet.

## 7. Troubleshooting

| Problema | Solución |
|----------|----------|
| `bad address checksum` tras fix | Hard reload (Ctrl+Shift+R); `rm -rf frontend/.next`; redeploy en Vercel |
| "faltan contratos desplegados" | Env vars en hosting + **redeploy** |
| MetaMask no cambia red | Usar "Switch network" (datos de `SUPPORTED_CHAINS`) |
| USDC en 0 | Faucet en la **misma** red que MetaMask |
| Depósito pide 2 firmas | Normal: `approve` + `deposit` |
| Copiloto en demo | `DEEPSEEK_API_KEY` en backend / Vercel |

## 8. Scroll en producción (resumen)

1. `git push` (checksum + defaults Scroll).
2. Vercel: 4 vars Scroll (o confiar en defaults del código).
3. Redeploy.
4. MetaMask → Scroll Sepolia (`534351`).
5. Operar con USDC y contratos de Scroll.

Contratos **no** se despliegan en Vercel; solo el frontend/backend. Ver `vercel.json` (`experimentalServices`).
