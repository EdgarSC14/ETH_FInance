"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Calendar, TrendingUp, Coins, X, AlertCircle, Ban } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { useGoalManager } from "@/hooks/useGoalManager";
import { formatUSDC, percentOf, daysUntil } from "@/lib/utils";
import { Goal } from "@/types";
import { staggerContainer, staggerItem, pageTransitionConfig } from "@/lib/motion";
import { es } from "@/lib/i18n/es";
import { userErrorMessage } from "@/lib/i18n/userError";

const EMOJI_OPTIONS = ["🎯", "🛡️", "💻", "✈️", "🏠", "🎓", "🚗", "💰", "🌍", "📱"];

function chipClass(active: boolean) {
  return active
    ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
    : "bg-bg-muted border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-white/5";
}

function GoalCard({
  goal,
  index,
  onFund,
  onCancel,
}: {
  goal: Goal;
  index: number;
  onFund?: (goal: Goal) => void;
  onCancel?: (goal: Goal) => void;
}) {
  const progress = percentOf(goal.savedAmount, goal.targetAmount);
  const days = daysUntil(goal.deadline);
  const isComplete = goal.status === "completed" || progress >= 100;
  const isOnChain = goal.id.startsWith("chain-");

  return (
    <motion.div
      variants={staggerItem}
      custom={index}
      className="list-item-card hover:border-emerald-500/15"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-xl">
          {goal.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-primary)] font-medium text-sm">{goal.name}</span>
            <Badge variant={isComplete ? "success" : days < 30 ? "warning" : "neutral"}>
              {isComplete ? es.goals.complete : `${Math.round(progress)}%`}
            </Badge>
            {isOnChain && (
              <Badge variant="income" className="text-[9px] py-0 px-1.5">
                {es.goals.onChainBadge}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--text-muted)] mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {days} {es.goals.daysLeft}
            </span>
            <span className="font-amount">
              {formatUSDC(goal.savedAmount)} / {formatUSDC(goal.targetAmount)}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400/90">
              <TrendingUp className="w-3 h-3" />
              {formatUSDC(goal.monthlyContribution)}
              {es.goals.perMonth}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="font-amount text-[var(--text-primary)] font-semibold text-sm">
            {formatUSDC(goal.savedAmount)}
          </div>
          <div className="flex flex-col gap-1.5">
            {onFund && goal.status === "active" && !isComplete && (
              <Button size="sm" variant="secondary" onClick={() => onFund(goal)} icon={<Coins className="w-3.5 h-3.5" />}>
                {es.goals.fund}
              </Button>
            )}
            {onCancel && goal.status === "active" && isOnChain && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onCancel(goal)}
                icon={<Ban className="w-3.5 h-3.5" />}
                className="text-red-400/90 hover:text-red-300"
              >
                {es.goals.cancelGoal}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreateGoalModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const { addGoal, bumpAllOnChainRefresh } = useAppStore();
  const { isConnected } = useWallet();
  const { createGoal, hasGoalManager } = useGoalManager();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    emoji: "🎯",
    targetAmount: "",
    deadline: "",
    monthlyContribution: "",
  });

  useEffect(() => setMounted(true), []);

  const handleCreate = async () => {
    if (submitting || !form.name || !form.targetAmount || !form.deadline) return;
    const monthly = parseFloat(form.monthlyContribution) || 0;
    if (monthly <= 0) {
      setErrorMsg(es.goals.monthlyRequired);
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      if (isConnected && hasGoalManager) {
        await createGoal({
          name: form.name,
          emoji: form.emoji,
          targetAmount: parseFloat(form.targetAmount),
          deadline: form.deadline,
          monthlyContribution: monthly,
        });
        bumpAllOnChainRefresh();
      } else {
        addGoal({
          id: `user-${Date.now()}`,
          name: form.name,
          emoji: form.emoji,
          targetAmount: parseFloat(form.targetAmount),
          savedAmount: 0,
          deadline: form.deadline,
          monthlyContribution: monthly,
          status: "active",
        });
      }
      onClose();
    } catch (e) {
      setErrorMsg(userErrorMessage(e, es.goals.txFailed));
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-goal-title"
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 border-0 cursor-default"
        onClick={submitting ? undefined : onClose}
        aria-label={es.goals.cancel}
      />
      <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
        <motion.div
          className="modal-panel pointer-events-auto max-h-[90vh] overflow-y-auto w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={pageTransitionConfig}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="create-goal-title" className="text-xl font-semibold text-[var(--text-primary)] mb-1">
            {es.goals.createTitle}
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-5">
            {isConnected && hasGoalManager ? es.goals.createOnChainHint : es.goals.demoOnChainHint}
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-1 p-1 bg-bg-muted rounded-lg">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`text-2xl p-1.5 rounded-md transition-all ${
                    form.emoji === e ? "bg-emerald-600/30 ring-1 ring-emerald-500/50" : "hover:bg-white/5"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            {[
              { key: "name", label: es.goals.goalName, placeholder: es.goals.goalNamePlaceholder, type: "text" },
              { key: "targetAmount", label: es.goals.targetAmount, placeholder: "5000", type: "number" },
              { key: "deadline", label: es.goals.targetDate, placeholder: "", type: "date" },
              { key: "monthlyContribution", label: es.goals.monthlyContribution, placeholder: "200", type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="input-field"
                />
              </div>
            ))}
          </div>

          {errorMsg && (
            <p className="text-red-400/90 text-xs mt-4 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={submitting} className="flex-1 justify-center">
              {es.goals.cancel}
            </Button>
            <Button disabled={submitting} onClick={handleCreate} className="flex-1 justify-center">
              {submitting
                ? es.goals.creating
                : isConnected && hasGoalManager
                  ? es.goals.createOnChain
                  : es.goals.create}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}

function FundGoalModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const { vaultBalance, bumpAllOnChainRefresh } = useAppStore();
  const { fundGoalFromVault, fundGoalFromWallet } = useGoalManager();
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"vault" | "wallet">("vault");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => setMounted(true), []);

  const numAmount = parseFloat(amount) || 0;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const maxAmount = source === "vault" ? Math.min(vaultBalance, remaining) : remaining;
  const canSubmit = numAmount > 0 && numAmount <= maxAmount && !submitting;

  const handleFund = async () => {
    if (!canSubmit) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      if (source === "vault") {
        await fundGoalFromVault(goal.id, numAmount);
      } else {
        await fundGoalFromWallet(goal.id, numAmount);
      }
      bumpAllOnChainRefresh();
      onClose();
    } catch (e) {
      setErrorMsg(userErrorMessage(e, es.goals.txFailed));
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 border-0 cursor-default"
        onClick={submitting ? undefined : onClose}
        aria-label={es.goals.cancel}
      />
      <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
        <motion.div
          className="modal-panel pointer-events-auto w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={pageTransitionConfig}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-panel-header mb-0 pb-0 border-0">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{es.goals.fundTitle}</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                {goal.emoji} {goal.name} · {formatUSDC(remaining)} {es.goals.fundRemaining}
              </p>
            </div>
            <button type="button" onClick={onClose} disabled={submitting} className="modal-panel-close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5 mb-4">
            <button
              type="button"
              onClick={() => setSource("vault")}
              className={`py-2.5 rounded-lg text-sm border transition-all ${chipClass(source === "vault")}`}
            >
              {es.goals.fundFromVault} ({formatUSDC(vaultBalance)})
            </button>
            <button
              type="button"
              onClick={() => setSource("wallet")}
              className={`py-2.5 rounded-lg text-sm border transition-all ${chipClass(source === "wallet")}`}
            >
              {es.goals.fundFromWallet}
            </button>
          </div>

          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xl">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="modal-amount-input pl-8 pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">USDC</span>
          </div>

          <div className="flex gap-2 mb-4">
            {[25, 50, 100].map((pct) => {
              const val = Math.floor(maxAmount * (pct / 100) * 100) / 100;
              return (
                <button
                  key={pct}
                  type="button"
                  disabled={maxAmount <= 0}
                  onClick={() => setAmount(val > 0 ? val.toString() : "")}
                  className={`flex-1 py-2 rounded-lg text-xs border transition-all ${chipClass(false)} disabled:opacity-30`}
                >
                  {pct}%
                </button>
              );
            })}
            <button
              type="button"
              disabled={maxAmount <= 0}
              onClick={() => setAmount(maxAmount.toString())}
              className={`flex-1 py-2 rounded-lg text-xs border transition-all ${chipClass(false)} disabled:opacity-30`}
            >
              {es.withdraw.quickMax}
            </button>
          </div>

          {numAmount > maxAmount && (
            <p className="text-red-400/90 text-xs mb-3">{es.goals.amountExceeds}</p>
          )}
          {errorMsg && (
            <p className="text-red-400/90 text-xs mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
            </p>
          )}

          <Button className="w-full justify-center" size="lg" disabled={!canSubmit} onClick={handleFund}>
            {submitting ? es.goals.fundProcessing : es.goals.fundBtn}
          </Button>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}

export function GoalsPanel() {
  const { goals, onChainGoalsLoading, bumpGoalsRefresh, bumpBalanceRefresh } = useAppStore();
  const { isConnected } = useWallet();
  const { hasGoalManager, cancelGoal } = useGoalManager();
  const [showCreate, setShowCreate] = useState(false);
  const [fundGoal, setFundGoal] = useState<Goal | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const visible =
    isConnected && hasGoalManager ? goals : isConnected ? goals.filter((g) => g.id.startsWith("user-")) : goals;

  const activeGoals = visible.filter((g) => g.status === "active");
  const completedGoals = visible.filter((g) => g.status === "completed");
  const canFundOnChain = isConnected && hasGoalManager;

  const handleCancelGoal = async (goal: Goal) => {
    if (cancellingId || !window.confirm(es.goals.cancelConfirm)) return;
    setCancellingId(goal.id);
    try {
      await cancelGoal(goal.id);
      bumpGoalsRefresh();
      bumpBalanceRefresh();
    } catch {
      // error surfaced by hook
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[var(--text-muted)] text-sm space-y-1">
          <p>
            {activeGoals.length} {es.goals.activeCount} · {completedGoals.length} {es.goals.completedCount}
            {onChainGoalsLoading && <span className="text-emerald-400 ml-2">{es.dashboard.updating}</span>}
          </p>
          {isConnected && hasGoalManager && (
            <p className="text-[11px] text-emerald-400/90">{es.goals.onChainSynced}</p>
          )}
          {isConnected && !hasGoalManager && (
            <p className="text-[11px] text-amber-400/90">{es.goals.envHint}</p>
          )}
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)} className="flex-shrink-0">
          {es.goals.newGoal}
        </Button>
      </div>

      {activeGoals.length === 0 && (
        <GlassCard className="card-padding empty-state" hover={false}>
          <div className="empty-state-icon mx-auto">
            <Target className="w-5 h-5" />
          </div>
          <p className="empty-state-title mb-4">
            {isConnected ? es.goals.emptyConnected : es.goals.emptyDemo}
          </p>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            {es.goals.newGoal}
          </Button>
        </GlassCard>
      )}

      <motion.div
        className="panel-scroll list-panel-scroll space-y-3 -mr-1 pr-1"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {activeGoals.map((goal, i) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={i}
            onFund={canFundOnChain && goal.id.startsWith("chain-") ? setFundGoal : undefined}
            onCancel={
              canFundOnChain && goal.id.startsWith("chain-") && cancellingId !== goal.id
                ? handleCancelGoal
                : undefined
            }
          />
        ))}
      </motion.div>

      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-medium mb-3">
            {es.goals.completedSection}
          </h3>
          <div className="panel-scroll list-panel-scroll space-y-2 -mr-1 pr-1">
            {completedGoals.map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} index={i} />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} />}
        {fundGoal && <FundGoalModal goal={fundGoal} onClose={() => setFundGoal(null)} />}
      </AnimatePresence>
    </div>
  );
}
