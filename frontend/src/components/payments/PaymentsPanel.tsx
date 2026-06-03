"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, Send, Calendar, Repeat, Play, XCircle, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { usePaymentRouter } from "@/hooks/usePaymentRouter";
import { formatUSDC, formatAddress } from "@/lib/utils";
import { PaymentFrequency, ScheduledPayment } from "@/types";
import { staggerContainer, staggerItem, pageTransitionConfig } from "@/lib/motion";
import { es } from "@/lib/i18n/es";
import { userErrorMessage } from "@/lib/i18n/userError";

const freqColors = {
  OneTime: "neutral" as const,
  Daily: "warning" as const,
  Weekly: "info" as const,
  Monthly: "income" as const,
};

function chipClass(active: boolean) {
  return active
    ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
    : "bg-bg-muted border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-white/5";
}

function SchedulePaymentModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const { bumpAllOnChainRefresh } = useAppStore();
  const { isConnected } = useWallet();
  const { schedulePayment, hasPaymentRouter } = usePaymentRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    label: "",
    recipient: "",
    amount: "",
    frequency: "Monthly" as PaymentFrequency,
    nextDate: "",
  });

  useEffect(() => setMounted(true), []);

  const handleCreate = async () => {
    if (submitting || !form.label || !form.amount) return;

    setErrorMsg("");
    setSubmitting(true);
    try {
      if (isConnected && hasPaymentRouter) {
        if (!form.recipient.trim()) {
          throw new Error(es.errors.recipientRequired);
        }
        await schedulePayment({
          recipient: form.recipient.trim(),
          amount: parseFloat(form.amount),
          frequency: form.frequency,
          startDate: form.nextDate || new Date().toISOString().slice(0, 10),
          label: form.label,
        });
        bumpAllOnChainRefresh();
      } else {
        throw new Error(es.errors.connectPaymentRouter);
      }
      onClose();
    } catch (e) {
      setErrorMsg(userErrorMessage(e, es.payments.txFailed));
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-payment-title"
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 modal-backdrop border-0 cursor-default"
        onClick={submitting ? undefined : onClose}
        aria-label={es.payments.cancel}
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
          <h2 id="schedule-payment-title" className="modal-title mb-1">
            {es.payments.scheduleTitle}
          </h2>
          <p className="modal-subtitle mb-6">
            {isConnected && hasPaymentRouter ? es.payments.onChainHint : es.payments.connectHint}
          </p>

          <div className="form-stack">
            {[
              { key: "label", label: es.payments.paymentLabel, placeholder: es.payments.paymentLabelPlaceholder, type: "text" },
              { key: "recipient", label: es.payments.recipientAddress, placeholder: es.payments.recipientPlaceholder, type: "text" },
              { key: "amount", label: es.payments.amount, placeholder: "1200", type: "number" },
              { key: "nextDate", label: es.payments.firstPaymentDate, placeholder: "", type: "date" },
            ].map((field) => (
              <div key={field.key} className="form-group">
                <label className="form-label">
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
            <div className="form-group">
              <label className="form-label">{es.payments.frequency}</label>
              <div className="grid grid-cols-4 gap-2">
                {(["OneTime", "Daily", "Weekly", "Monthly"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, frequency: f }))}
                    className={`py-2 rounded-lg text-xs border transition-all ${chipClass(form.frequency === f)}`}
                  >
                    {es.payments.freq[f]}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{es.payments.cancelLockHint}</p>
          </div>

          {errorMsg && (
            <p className="text-red-400/90 text-xs mt-4 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={submitting} className="flex-1 justify-center">
              {es.payments.cancel}
            </Button>
            <Button disabled={submitting} onClick={handleCreate} className="flex-1 justify-center">
              {submitting
                ? es.payments.scheduling
                : isConnected && hasPaymentRouter
                  ? es.payments.scheduleOnChain
                  : es.payments.scheduleBtn}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}

function PaymentRow({
  payment,
  index,
  onChain,
  vaultBalance,
  onExecute,
  onCancel,
  busyId,
  actionError,
}: {
  payment: ScheduledPayment;
  index: number;
  onChain: boolean;
  vaultBalance: number;
  onExecute?: (p: ScheduledPayment) => void;
  onCancel?: (p: ScheduledPayment) => void;
  busyId: string | null;
  actionError: string | null;
}) {
  const isBusy = busyId === payment.id;
  const insufficientVault = payment.amount > vaultBalance;
  const canExecute = payment.isDue && !insufficientVault;

  return (
    <motion.div
      variants={staggerItem}
      custom={index}
      className="list-item-card"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Repeat className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-primary)] font-medium text-sm">{payment.label}</span>
            <Badge variant={freqColors[payment.frequency]}>{es.payments.freq[payment.frequency]}</Badge>
            {payment.isDue && payment.active && <Badge variant="warning">{es.payments.due}</Badge>}
            {!payment.active && <Badge variant="neutral">{es.payments.inactive}</Badge>}
            {onChain && payment.id.startsWith("chain-") && (
              <Badge variant="income" className="text-[9px]">
                {es.payments.onChainBadge}
              </Badge>
            )}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate font-mono">
            → {formatAddress(payment.recipient)} · {payment.executionCount} {es.payments.executed}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-amount text-[var(--text-primary)] font-semibold">{formatUSDC(payment.amount)}</div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] justify-end mt-0.5">
            <Calendar className="w-3 h-3" />
            {payment.nextDate}
          </div>
        </div>
      </div>

      {onChain && payment.id.startsWith("chain-") && payment.active && (
        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
          {payment.isDue && insufficientVault && (
            <p className="text-amber-400/90 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {es.payments.vaultInsufficient(formatUSDC(vaultBalance), formatUSDC(payment.amount))}
            </p>
          )}
          {actionError && (
            <p className="text-red-400/90 text-xs">{actionError}</p>
          )}
          <div className="flex gap-2 flex-wrap max-sm:flex-col">
            {payment.isDue && onExecute && (
              <Button
                size="sm"
                disabled={isBusy || !canExecute}
                onClick={() => onExecute(payment)}
                icon={<Play className="w-3.5 h-3.5" />}
                className="flex-1 justify-center min-w-[140px] max-sm:min-h-11 max-sm:w-full"
              >
                {isBusy ? es.payments.executing : es.payments.executeNow}
              </Button>
            )}
            {payment.canCancel && onCancel && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isBusy}
                onClick={() => onCancel(payment)}
                icon={<XCircle className="w-3.5 h-3.5" />}
                className="flex-1 justify-center min-w-[120px] max-sm:min-h-11 max-sm:w-full"
              >
                {es.payments.cancelPayment}
              </Button>
            )}
            {!payment.canCancel && !payment.isDue && (
              <p className="text-[10px] text-[var(--text-muted)] self-center">{es.payments.timelockHint}</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function PaymentsPanel() {
  const { payments, onChainPaymentsLoading, bumpAllOnChainRefresh, vaultBalance } = useAppStore();
  const { isConnected } = useWallet();
  const { executePayment, cancelPayment, hasPaymentRouter } = usePaymentRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [executeError, setExecuteError] = useState<{ id: string; msg: string } | null>(null);

  const onChain = isConnected && hasPaymentRouter;
  const visible = payments;

  const totalMonthly = visible
    .filter((p) => p.active && p.frequency === "Monthly")
    .reduce((s, p) => s + p.amount, 0);

  const handleExecute = async (payment: ScheduledPayment) => {
    if (payment.amount > vaultBalance) {
      setExecuteError({
        id: payment.id,
        msg: es.payments.vaultInsufficient(formatUSDC(vaultBalance), formatUSDC(payment.amount)),
      });
      return;
    }
    setBusyId(payment.id);
    setExecuteError(null);
    try {
      await executePayment(payment.id);
      bumpAllOnChainRefresh();
    } catch (e) {
      const msg = userErrorMessage(e, es.payments.txFailed);
      if (msg.includes("insufficient") || msg.includes("insuficiente")) {
        setExecuteError({
          id: payment.id,
          msg: es.payments.vaultInsufficient(formatUSDC(vaultBalance), formatUSDC(payment.amount)),
        });
      } else {
        setExecuteError({
          id: payment.id,
          msg: msg.length > 120 ? es.payments.txFailed : msg,
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (payment: ScheduledPayment) => {
    setBusyId(payment.id);
    setExecuteError(null);
    try {
      await cancelPayment(payment.id);
      bumpAllOnChainRefresh();
    } catch (e) {
      setExecuteError({
        id: payment.id,
        msg: userErrorMessage(e, es.payments.cancelFailed),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[var(--text-muted)] text-sm space-y-1">
          <p>{es.payments.subtitle}</p>
          {onChain && <p className="text-[11px] text-emerald-400/90">{es.payments.vaultLine(formatUSDC(vaultBalance))}</p>}
          {onChainPaymentsLoading && (
            <p className="text-[11px] text-emerald-400/90">{es.dashboard.updating}</p>
          )}
          {isConnected && !hasPaymentRouter && (
            <p className="text-[11px] text-amber-400/90">{es.payments.envHint}</p>
          )}
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)} className="flex-shrink-0">
          {es.payments.schedule}
        </Button>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          {
            label: es.payments.activeSchedules,
            value: visible.filter((p) => p.active).length.toString(),
            icon: Clock,
            color: "text-emerald-400",
          },
          {
            label: es.payments.monthlyOutflow,
            value: formatUSDC(totalMonthly),
            icon: Send,
            color: "text-red-400",
          },
          {
            label: es.payments.totalExecuted,
            value: visible.reduce((s, p) => s + p.executionCount, 0).toString(),
            icon: CheckCircle2,
            color: "text-emerald-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} variants={staggerItem}>
            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                {label}
              </div>
              <div className="font-amount text-xl font-semibold text-[var(--text-primary)]">{value}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="panel-scroll list-panel-scroll space-y-2 -mr-1 pr-1"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {visible.length === 0 && (
          <GlassCard className="p-10 text-center" hover={false}>
            <p className="text-[var(--text-muted)] text-sm">{es.payments.empty}</p>
          </GlassCard>
        )}
        {visible.map((p, i) => (
          <PaymentRow
            key={p.id}
            payment={p}
            index={i}
            onChain={onChain}
            vaultBalance={vaultBalance}
            onExecute={onChain ? handleExecute : undefined}
            onCancel={onChain ? handleCancel : undefined}
            busyId={busyId}
            actionError={executeError?.id === p.id ? executeError.msg : null}
          />
        ))}
      </motion.div>

      <AnimatePresence>{showCreate && <SchedulePaymentModal onClose={() => setShowCreate(false)} />}</AnimatePresence>
    </div>
  );
}
