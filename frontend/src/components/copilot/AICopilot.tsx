"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { analyzePlan, sendChatMessage } from "@/lib/api";
import { healthScoreColor, healthScoreLabel } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { ChatMessage } from "@/types";
import { COLORS } from "@/lib/constants";
import { es } from "@/lib/i18n/es";

const MAX_CHAT_HISTORY = 20;

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-emerald-600/30 border border-emerald-500/30" : "bg-bg-muted border border-[var(--border-subtle)]"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-emerald-400" /> : <Bot className="w-4 h-4 text-[var(--text-muted)]" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-emerald-600/20 border border-emerald-500/25 text-[var(--text-primary)]"
            : "bg-bg-muted/90 border border-[var(--border-subtle)] text-[var(--text-primary)]/95 shadow-sm"
        }`}
      >
        {msg.content}
        <div className={`text-[10px] mt-1.5 ${isUser ? "text-emerald-400/60" : "text-[var(--text-muted)]"}`}>
          {new Date(msg.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
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
      className="border border-[var(--border-subtle)] rounded-xl p-5 bg-bg-elevated space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{es.copilot.planTitle}</div>
          <div className="text-sm text-[var(--text-primary)] leading-snug">{plan.summary}</div>
        </div>
        <div className="text-center flex-shrink-0">
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
            className="text-xs px-3 py-1 rounded-md border font-amount"
            style={{ borderColor: `${item.color}40`, background: `${item.color}12`, color: item.color }}
          >
            {item.label}: {item.value}%
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{es.copilot.recommendations}</div>
        {plan.recommendations.slice(0, 3).map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2 text-xs text-[var(--text-muted)]"
          >
            <span className="text-emerald-500 mt-0.5">•</span>
            {r}
          </motion.div>
        ))}
      </div>

      {plan.smartContractActions.length > 0 && (
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">{es.copilot.onChainActions}</div>
          <div className="space-y-1.5">
            {plan.smartContractActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2"
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatHistory, isChatLoading]);

  const profile = {
    address: isConnected && address ? address : "0xDemoNotConnected",
    monthlyIncome,
    monthlyExpenses,
    currentBalance: (walletUsdcBalance ?? 0) + vaultBalance,
    transactions: isConnected ? transactions.filter((t) => t.id.startsWith("chain-") || t.id.startsWith("user-")) : transactions,
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
    if (!input.trim() || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
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
      const { reply, warning } = await sendChatMessage(input, profile, history);
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-start">
      <GlassCard className="card-padding flex flex-col copilot-panel-height min-h-0" hover={false}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[var(--text-primary)] font-medium text-sm">{es.copilot.title}</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {es.copilot.online}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={clearChatHistory}
                aria-label={es.copilot.clearChat}
              >
                {es.copilot.clearChat}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              loading={isPlanLoading}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={handleGeneratePlan}
            >
              {es.copilot.generatePlan}
            </Button>
          </div>
        </div>

        <div
          ref={chatScrollRef}
          className="panel-scroll flex-1 min-h-0 space-y-4 pr-1 mb-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          {chatHistory.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-4">
                {es.copilot.greeting}
                <br />
                {es.copilot.greetingHint}
              </p>
              <div className="space-y-2">
                {es.copilot.suggested.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setInput(q)}
                    className="block w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-bg-muted hover:bg-white/5 border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 transition-colors"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {chatHistory.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isChatLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-muted border border-[var(--border-subtle)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
              <div className="bg-bg-muted border border-[var(--border-subtle)] rounded-xl px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 flex-shrink-0 max-sm:flex-col">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={es.copilot.placeholder}
            className="input-field flex-1 min-h-11"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            size="md"
            className="max-sm:min-h-11 max-sm:w-full max-sm:justify-center"
            icon={<Send className="w-4 h-4" />}
          >
            {es.copilot.send}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="card-padding flex flex-col copilot-panel-height min-h-0 overflow-hidden" hover={false}>
        <div className="pb-4 mb-4 flex-shrink-0 border-b border-[var(--border-subtle)]">
          <p className="form-label">{es.copilot.planTitle}</p>
        </div>
        <div className="panel-scroll flex-1 min-h-0 -mx-1 px-1">
          {isPlanLoading ? (
            <div className="py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-4"
              />
              <p className="text-[var(--text-muted)] text-sm">{es.copilot.analyzing}</p>
            </div>
          ) : plan ? (
            <PlanOverview />
          ) : (
            <div className="py-8 text-center">
              <Sparkles className="w-10 h-10 text-[var(--text-muted)] opacity-40 mx-auto mb-3" />
              <p className="text-[var(--text-muted)] text-sm mb-4">{es.copilot.planEmpty}</p>
              <Button
                onClick={handleGeneratePlan}
                loading={isPlanLoading}
                icon={<Sparkles className="w-4 h-4" />}
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
