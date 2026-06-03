"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ExternalLink, Wallet } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CardHeader } from "@/components/ui/CardHeader";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC, cn } from "@/lib/utils";
import { Transaction } from "@/types";
import { staggerItem } from "@/lib/motion";
import { getExplorerTxUrl } from "@/lib/deployments";
import { es } from "@/lib/i18n/es";

const typeConfig = {
  income: { icon: ArrowUpRight, color: "text-emerald-400", bg: "bg-emerald-500/10", badge: "income" as const },
  expense: { icon: ArrowDownLeft, color: "text-red-400", bg: "bg-red-500/10", badge: "expense" as const },
  transfer: { icon: ArrowLeftRight, color: "text-[var(--text-muted)]", bg: "bg-white/5", badge: "neutral" as const },
};

function TxRow({ tx, index, chainId }: { tx: Transaction; index: number; chainId?: number | null }) {
  const { icon: Icon, color, bg, badge } = typeConfig[tx.type];
  const explorerUrl = tx.hash && chainId != null ? getExplorerTxUrl(chainId, tx.hash) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="data-table-row cols-3 group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description}</span>
          <Badge variant={badge}>{tx.category}</Badge>
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1 font-mono tabular-nums">{tx.date}</div>
      </div>

      <span className="hidden sm:block text-xs text-[var(--text-muted)] truncate">{tx.category}</span>

      <div className="flex items-center justify-end gap-2">
        <span className={`font-mono text-sm font-semibold tabular-nums ${color}`}>
          {tx.type === "expense" ? "−" : "+"}
          {formatUSDC(tx.amount)}
        </span>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-opacity"
            aria-label="Ver en explorador"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export function TransactionFeed({ className }: { className?: string }) {
  const { transactions, onChainTransactionsLoading } = useAppStore();
  const { isConnected, chainId } = useWallet();

  const list = transactions;
  const metaLabel = isConnected
    ? onChainTransactionsLoading
      ? es.dashboard.updating
      : es.dashboard.onChainCount(list.length)
    : `${transactions.length} ${es.dashboard.demoLabel}`;

  return (
    <GlassCard
      className={cn("card-padding flex flex-col min-h-[300px] lg:min-h-[320px] max-h-[420px]", className)}
      variants={staggerItem}
    >
      <CardHeader title={es.dashboard.recentTransactions} subtitle={metaLabel} />

      {isConnected && !onChainTransactionsLoading && list.length === 0 && (
        <div className="empty-state flex-1">
          <div className="empty-state-icon">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="empty-state-title">{es.dashboard.noTxTitle}</p>
          <p className="empty-state-hint">{es.dashboard.noTxHint}</p>
        </div>
      )}

      {list.length > 0 && (
        <div className="data-table flex-1 min-h-0">
          <div className="data-table-head cols-3 hidden sm:grid">
            <span />
            <span>Descripción</span>
            <span>Categoría</span>
            <span className="text-right">Monto</span>
          </div>
          <div className="panel-scroll data-table-body flex-1 -mx-1 px-1">
            <AnimatePresence>
              {list.map((tx, i) => (
                <TxRow key={tx.id} tx={tx} index={i} chainId={chainId} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {list.length === 0 && onChainTransactionsLoading && (
        <div className="empty-state flex-1">
          <p className="empty-state-hint">{es.dashboard.updating}</p>
        </div>
      )}
    </GlassCard>
  );
}
