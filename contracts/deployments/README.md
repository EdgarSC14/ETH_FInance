# Deployments

| Archivo | Uso |
|---------|-----|
| `*.example.json` | Referencia en git (plantilla o deploy de referencia). |
| `arbitrumSepolia.json`, `scrollSepolia.json`, `baseSepolia.json` | Generados por `deploy:*` en local; **gitignored**. |

Tras desplegar en Base Sepolia:

```bash
pnpm --filter ethfinance-contracts deploy:base
```

Copia el bloque `--- Frontend .env.local (copy) ---` a Vercel o pega las direcciones en `frontend/src/lib/constants.ts` (como Scroll).
