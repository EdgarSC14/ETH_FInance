"use client";

import { Award } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { useReputationRegistry } from "@/hooks/useReputationRegistry";
import { staggerItem } from "@/lib/motion";
import { es } from "@/lib/i18n/es";

export function ReputationCard() {
  const { isConnected } = useWallet();
  const { reputationScore, onChainReputationLoading } = useAppStore();
  const { hasReputation } = useReputationRegistry();

  if (!isConnected || !hasReputation) return null;

  return (
    <GlassCard className="card-padding flex flex-col justify-center min-h-[280px]" variants={staggerItem}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>{es.reputation.title}</span>
        </div>
        <Badge variant="income">{es.dashboard.onChain}</Badge>
      </div>

      <div className="font-amount text-3xl font-semibold text-[var(--text-primary)] tabular-nums">
        {onChainReputationLoading ? (
          <span className="text-[var(--text-muted)] text-lg">—</span>
        ) : (
          <AnimatedNumber value={reputationScore ?? 0} decimals={0} />
        )}
      </div>
      <p className="text-[var(--text-muted)] text-sm mt-2">{es.reputation.hint}</p>
    </GlassCard>
  );
}
