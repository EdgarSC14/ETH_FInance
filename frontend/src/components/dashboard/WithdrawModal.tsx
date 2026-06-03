"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { useVault } from "@/hooks/useVault";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC } from "@/lib/utils";
import { pageTransitionConfig } from "@/lib/motion";
import { es } from "@/lib/i18n/es";
import { userErrorMessage } from "@/lib/i18n/userError";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const STEPS = ["input", "confirm", "success", "error"] as const;
type Step = (typeof STEPS)[number];

function pctAmount(vaultBalance: number, pct: number): string {
  const v = Math.floor(vaultBalance * pct * 100) / 100;
  return v > 0 ? v.toString() : "";
}

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  if (current === "error") return null;
  const progress = current === "success" ? 100 : ((idx + 1) / 2) * 50;

  return (
    <div className="w-full">
      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={pageTransitionConfig}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
        <span className={idx >= 0 ? "text-emerald-400" : ""}>{es.withdraw.stepAmount}</span>
        <span className={idx >= 1 ? "text-emerald-400" : ""}>{es.withdraw.stepConfirm}</span>
        <span className={current === "success" ? "text-emerald-400" : ""}>{es.withdraw.stepDone}</span>
      </div>
    </div>
  );
}

export function WithdrawModal() {
  const {
    withdrawModalOpen,
    setWithdrawModalOpen,
    setVaultBalance,
    vaultBalance,
    walletUsdcBalance,
    addTransaction,
    bumpAllOnChainRefresh,
  } = useAppStore();
  const { withdraw, isLoading } = useVault();
  const { isConnected } = useWallet();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [errorMsg, setErrorMsg] = useState("");

  const modalRef = useFocusTrap(withdrawModalOpen, () => setWithdrawModalOpen(false));

  const numAmount = parseFloat(amount) || 0;
  const exceedsVault = numAmount > vaultBalance;
  const canSubmit = numAmount > 0 && !exceedsVault;

  const quickAmounts = [
    { label: es.withdraw.quick25, value: pctAmount(vaultBalance, 0.25) },
    { label: es.withdraw.quick50, value: pctAmount(vaultBalance, 0.5) },
    { label: es.withdraw.quick75, value: pctAmount(vaultBalance, 0.75) },
    { label: es.withdraw.quickMax, value: vaultBalance > 0 ? vaultBalance.toString() : "" },
  ];

  const handleContinue = () => {
    if (!canSubmit) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    try {
      if (isConnected) {
        const receipt = await withdraw(numAmount);
        bumpAllOnChainRefresh();
        addTransaction({
          id: `user-${Date.now()}`,
          type: "transfer",
          category: es.withdraw.category,
          amount: numAmount,
          description: es.withdraw.descOnChain,
          date: new Date().toISOString().slice(0, 10),
          hash: receipt?.hash,
        });
      } else {
        setVaultBalance(Math.max(0, vaultBalance - numAmount));
        addTransaction({
          id: `user-${Date.now()}`,
          type: "transfer",
          category: es.withdraw.category,
          amount: numAmount,
          description: es.withdraw.descDemo,
          date: new Date().toISOString().slice(0, 10),
        });
      }
      setStep("success");
    } catch (e) {
      setErrorMsg(userErrorMessage(e, es.withdraw.txFailed));
      setStep("error");
    }
  };

  const handleClose = () => {
    setWithdrawModalOpen(false);
    setTimeout(() => {
      setStep("input");
      setAmount("");
      setErrorMsg("");
    }, 300);
  };

  return (
    <AnimatePresence>
      {withdrawModalOpen && (
        <>
          <motion.div
            className="fixed inset-0 modal-backdrop z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={pageTransitionConfig}
          >
            <div className="modal-panel relative w-full" ref={modalRef} role="dialog" aria-modal="true">
              <div className="modal-panel-header">
                <div className="flex-1 min-w-0 pr-2">
                  <StepIndicator current={step} />
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="modal-panel-close"
                  aria-label={es.withdraw.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {step === "input" && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={pageTransitionConfig}
                  >
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">{es.withdraw.title}</h2>
                    <p className="text-[var(--text-muted)] text-sm mb-2">{es.withdraw.subtitle}</p>
                    <p className="text-emerald-400/80 text-xs mb-6">
                      {es.withdraw.availableInVault}:{" "}
                      <strong className="text-[var(--text-primary)] modal-amount-sm">{formatUSDC(vaultBalance)}</strong>
                    </p>

                    <div className="grid grid-cols-4 gap-2.5 mb-5">
                      {quickAmounts.map(({ label, value }) => (
                        <button
                          key={label}
                          type="button"
                          disabled={!value}
                          onClick={() => setAmount(value)}
                          className={`py-2.5 rounded-lg modal-amount-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            amount === value
                              ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                              : "bg-bg-muted border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-white/5"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-base modal-amount-sm pointer-events-none">
                        $
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-field modal-amount-input pl-9 pr-[4.5rem] py-3.5 w-full min-w-0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none">
                        USDC
                      </span>
                    </div>

                    {exceedsVault && (
                      <p className="text-red-400/90 text-xs mb-4 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {es.withdraw.insufficientVault}
                      </p>
                    )}

                    {!isConnected && (
                      <p className="text-amber-400/80 text-xs mb-4 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {es.withdraw.demoHint}
                      </p>
                    )}

                    <Button
                      className="w-full justify-center"
                      size="lg"
                      disabled={!canSubmit}
                      onClick={handleContinue}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {es.withdraw.continue}
                    </Button>
                  </motion.div>
                )}

                {step === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={pageTransitionConfig}
                  >
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">{es.withdraw.confirmTitle}</h2>
                    <p className="text-[var(--text-muted)] text-sm mb-6">{es.withdraw.confirmSubtitle}</p>
                    <div className="bg-bg-muted rounded-lg p-4 mb-6 space-y-3 border border-[var(--border-subtle)]">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{es.withdraw.amount}</span>
                        <span className="modal-amount-sm text-[var(--text-primary)]">{formatUSDC(numAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{es.withdraw.token}</span>
                        <span className="text-[var(--text-primary)]">USDC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{es.withdraw.from}</span>
                        <span className="text-emerald-400">{es.dashboard.smartVault}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{es.withdraw.to}</span>
                        <span className="text-emerald-400">{es.withdraw.yourWallet}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-[var(--border-subtle)] pt-3">
                        <span className="text-[var(--text-muted)]">{es.withdraw.vaultAfter}</span>
                        <span className="modal-amount-sm text-[var(--text-primary)]">
                          {formatUSDC(Math.max(0, vaultBalance - numAmount))}
                        </span>
                      </div>
                      {isConnected && walletUsdcBalance != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-muted)]">{es.withdraw.walletAfter}</span>
                          <span className="modal-amount-sm text-[var(--text-primary)]">
                            {formatUSDC(walletUsdcBalance + numAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => setStep("input")} className="flex-1 justify-center">
                        {es.withdraw.back}
                      </Button>
                      <Button loading={isLoading} onClick={handleConfirm} className="flex-1 justify-center">
                        {isConnected ? es.withdraw.signAndWithdraw : es.withdraw.confirmDemo}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{es.withdraw.successTitle}</h2>
                    <p className="text-[var(--text-muted)] text-sm mb-6 modal-amount-sm">
                      {formatUSDC(numAmount)} {es.withdraw.successBody}
                    </p>
                    <Button onClick={handleClose} className="w-full justify-center">
                      {es.withdraw.done}
                    </Button>
                  </motion.div>
                )}

                {step === "error" && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{es.withdraw.failedTitle}</h2>
                    <p className="text-red-400/80 text-sm mb-6">{errorMsg}</p>
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => setStep("input")} className="flex-1 justify-center">
                        {es.withdraw.tryAgain}
                      </Button>
                      <Button onClick={handleClose} className="flex-1 justify-center">
                        {es.withdraw.close}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
