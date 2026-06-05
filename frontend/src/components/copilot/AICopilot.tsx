"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Trash2, MessageSquareQuote, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { analyzePlan, sendChatMessage } from "@/lib/api";
import { healthScoreColor, healthScoreLabel, cn } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { ChatMessage } from "@/types";
import { COLORS } from "@/lib/constants";
import { es } from "@/lib/i18n/es";

const MAX_CHAT_HISTORY = 20;

function isWarningMessage(content: string): boolean {
  return content.startsWith("⚠️");
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const isWarning = !isUser && isWarningMessage(msg.content);
  const time = new Date(msg.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-2.5 sm:gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm",
          isUser
            ? "border-emerald-400/35 bg-gradient-to-br from-emerald-600/35 to-emerald-500/10"
            : isWarning
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-emerald-300" aria-hidden />
        ) : isWarning ? (
          <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden />
        ) : (
          <Bot className="h-4 w-4 text-emerald-400/90" aria-hidden />
        )}
      </div>

      <div className={cn("flex max-w-[min(88%,28rem)] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <span className="px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {isUser ? es.copilot.you : es.copilot.assistant}
        </span>
        <div
          className={cn(
            "w-full rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-tr-md border border-emerald-500/30 bg-gradient-to-br from-emerald-600/28 via-emerald-600/14 to-emerald-500/6 text-[var(--text-primary)]"
              : isWarning
                ? "rounded-tl-md border border-amber-500/25 bg-amber-500/10 text-amber-100/95"
                : "rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-muted)]/90 text-[var(--text-primary)]/95",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          <div
            className={cn(
              "mt-2 text-[10px] tabular-nums",
              isUser ? "text-emerald-400/55" : isWarning ? "text-amber-400/70" : "text-[var(--text-muted)]",
            )}
          >
            {time}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 sm:gap-3" aria-live="polite" aria-label={es.copilot.typing}>
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <Bot className="h-4 w-4 text-emerald-400/80" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <span className="px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {es.copilot.assistant}
        </span>
        <div className="rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-muted)]/90 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)]">{es.copilot.typing}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatEmptyState({ onPickSuggestion }: { onPickSuggestion: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center px-2 py-4 text-center sm:py-6"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" aria-hidden />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-600/25 to-emerald-500/5">
          <Bot className="h-8 w-8 text-emerald-400" aria-hidden />
        </div>
      </div>
      <p className="max-w-sm text-sm font-medium text-[var(--text-primary)]">{es.copilot.greeting}</p>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">{es.copilot.greetingHint}</p>

      <div className="mt-6 w-full max-w-lg text-left">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {es.copilot.suggestionsTitle}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {es.copilot.suggested.map((q, i) => (
            <motion.button
              key={q}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              onClick={() => onPickSuggestion(q)}
              className="group flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/70 px-3.5 py-3 text-left transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/8"
            >
              <MessageSquareQuote
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/70 group-hover:text-emerald-400"
                aria-hidden
              />
              <span className="text-xs leading-snug text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                {q}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PlanOverview() {
  const { plan } = useAppStore();
  if (!plan) return null;
  const color = healthScoreColor(plan.healthScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {es.copilot.planTitle}
          </div>
          <div className="text-sm leading-snug text-[var(--text-primary)]">{plan.summary}</div>
        </div>
        <div className="shrink-0 text-center">
          <div className="font-amount text-3xl font-semibold" style={{ color }}>
            {plan.healthScore}
          </div>
          <div className="text-xs" style={{ color }}>
            {healthScoreLabel(plan.healthScore)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: es.copilot.allocation.savings, value: plan.allocation.savings, color: COLORS.chart[0] },
          { label: es.copilot.allocation.emergency, value: plan.allocation.emergencyFund, color: COLORS.chart[1] },
          { label: es.copilot.allocation.invest, value: plan.allocation.investments, color: COLORS.chart[2] },
          { label: es.copilot.allocation.expenses, value: plan.allocation.expenses, color: COLORS.chart[3] },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-md border px-3 py-1 font-amount text-xs"
            style={{ borderColor: `${item.color}40`, background: `${item.color}12`, color: item.color }}
          >
            {item.label}: {item.value}%
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{es.copilot.recommendations}</div>
        {plan.recommendations.slice(0, 3).map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2 text-xs text-[var(--text-muted)]"
          >
            <span className="mt-0.5 text-emerald-500">•</span>
            {r}
          </motion.div>
        ))}
      </div>

      {plan.smartContractActions.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {es.copilot.onChainActions}
          </div>
          <div className="space-y-1.5">
            {plan.smartContractActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs"
              >
                <span className="text-emerald-400/90">{action.label}</span>
                <Badge variant="neutral">
                  {es.copilot.actionTypes[action.type as keyof typeof es.copilot.actionTypes] ??
                    es.copilot.unknownAction}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function AICopilot() {
  const {
    chatHistory,
    addChatMessage,
    plan,
    setPlan,
    setIsPlanLoading,
    isPlanLoading,
    monthlyIncome,
    monthlyExpenses,
    vaultBalance,
    walletUsdcBalance,
    transactions,
    goals,
    riskTolerance,
    clearChatHistory,
  } = useAppStore();
  const { address, isConnected } = useWallet();
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatHistory, isChatLoading]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  const profile = {
    address: isConnected && address ? address : "0xDemoNotConnected",
    monthlyIncome,
    monthlyExpenses,
    currentBalance: (walletUsdcBalance ?? 0) + vaultBalance,
    transactions: isConnected
      ? transactions.filter((t) => t.id.startsWith("chain-") || t.id.startsWith("user-"))
      : transactions,
    goals: isConnected ? goals.filter((g) => g.id.startsWith("chain-") || g.id.startsWith("user-")) : goals,
    riskTolerance,
  };

  const handleGeneratePlan = async () => {
    setIsPlanLoading(true);
    try {
      const result = await analyzePlan(profile);
      const { demoMode, warning, ...plan } = result;
      setPlan(plan);
      if (warning) {
        addChatMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: es.copilot.demoModeNotice(warning),
          timestamp: new Date().toISOString(),
        });
      }
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: es.copilot.planGenerated(plan.healthScore, plan.diagnosis),
        timestamp: new Date().toISOString(),
      });
    } catch {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: es.copilot.backendUnreachable,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput("");
    setIsChatLoading(true);
    try {
      const history = chatHistory.slice(-MAX_CHAT_HISTORY).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { reply, warning } = await sendChatMessage(text, profile, history);
      if (warning) {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: es.copilot.demoModeNotice(warning),
          timestamp: new Date().toISOString(),
        });
      }
      addChatMessage({
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      });
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: es.copilot.backendError,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-2">
      <GlassCard className="card-padding flex min-h-0 flex-col overflow-hidden copilot-panel-height" hover={false}>
        <header className="copilot-panel-header">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="copilot-header-brand flex min-w-0 gap-3">
              <div className="copilot-header-logo">
                <Bot className="h-5 w-5 text-emerald-400" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{es.copilot.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  {es.copilot.online}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-2">
            {chatHistory.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={clearChatHistory}
                aria-label={es.copilot.clearChat}
                className="max-sm:px-2"
              >
                <span className="max-sm:sr-only">{es.copilot.clearChat}</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              loading={isPlanLoading}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={handleGeneratePlan}
            >
              {es.copilot.generatePlan}
            </Button>
            </div>
          </div>
        </header>

        <div
          ref={chatScrollRef}
          className="copilot-chat-scroll panel-scroll mb-4 min-h-0 flex-1 space-y-5 pr-1"
          aria-live="polite"
          aria-relevant="additions"
        >
          {chatHistory.length === 0 && !isChatLoading && (
            <ChatEmptyState onPickSuggestion={setInput} />
          )}
          <AnimatePresence initial={false}>
            {chatHistory.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
          {isChatLoading && <TypingIndicator />}
        </div>

        <div className="copilot-composer shrink-0">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={es.copilot.placeholder}
            className="copilot-composer-input"
            aria-label={es.copilot.placeholder}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            size="sm"
            className="mb-0.5 shrink-0 rounded-xl px-3.5"
            icon={<Send className="h-4 w-4" />}
            aria-label={es.copilot.send}
          >
            <span className="sr-only sm:not-sr-only">{es.copilot.send}</span>
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="card-padding flex min-h-0 flex-col overflow-hidden copilot-panel-height" hover={false}>
        <div className="mb-4 shrink-0 border-b border-[var(--border-subtle)] pb-4">
          <p className="form-label">{es.copilot.planTitle}</p>
        </div>
        <div className="panel-scroll -mx-1 min-h-0 flex-1 px-1">
          {isPlanLoading ? (
            <div className="py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent"
              />
              <p className="text-sm text-[var(--text-muted)]">{es.copilot.analyzing}</p>
            </div>
          ) : plan ? (
            <PlanOverview />
          ) : (
            <div className="py-8 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)] opacity-40" />
              <p className="mb-4 text-sm text-[var(--text-muted)]">{es.copilot.planEmpty}</p>
              <Button
                onClick={handleGeneratePlan}
                loading={isPlanLoading}
                icon={<Sparkles className="h-4 w-4" />}
                className="mx-auto"
              >
                {es.copilot.generateMyPlan}
              </Button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
