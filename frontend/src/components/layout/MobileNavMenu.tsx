"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Target, Send, Bot, Wallet, LogOut, X } from "lucide-react";
import { useAppStore, AppView } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { WalletMenu } from "@/components/layout/WalletMenu";
import { scrollToSection } from "@/hooks/useScrollNavigation";
import { es } from "@/lib/i18n/es";

const NAV_ITEMS: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: es.nav.dashboard, icon: LayoutDashboard },
  { id: "goals", label: es.nav.goals, icon: Target },
  { id: "payments", label: es.nav.payments, icon: Send },
  { id: "copilot", label: es.nav.copilot, icon: Bot },
];

interface MobileNavMenuProps {
  scrollRootRef: React.RefObject<HTMLElement | null>;
}

export function MobileNavMenu({ scrollRootRef }: MobileNavMenuProps) {
  const {
    mobileNavOpen,
    setMobileNavOpen,
    pageMode,
    activeView,
    vaultBalance,
  } = useAppStore();
  const { isConnected, connect, disconnect, isConnecting } = useWallet();

  const selectView = (id: AppView) => {
    setMobileNavOpen(false);
    scrollToSection(scrollRootRef.current, id);
  };

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNavOpen(false)}
          />
          <motion.nav
            className="fixed top-0 right-0 h-full w-[min(100%,20rem)] z-50 bg-bg-elevated border-l border-[var(--border-subtle)] flex flex-col md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <span className="font-semibold text-[var(--text-primary)]">{es.nav.menu}</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label={es.nav.closeMenu}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[var(--border-subtle)]">
              {isConnected ? (
                <WalletMenu compact />
              ) : (
                <>
                  <p className="text-label mb-1">{es.nav.balance}</p>
                  <p className="font-amount text-lg text-[var(--text-primary)]">
                    ${vaultBalance.toFixed(2)} USDC
                  </p>
                </>
              )}
            </div>

            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectView(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    activeView === id && pageMode !== "landing"
                      ? "bg-white/5 text-[var(--text-primary)] border-l-2 border-emerald-500"
                      : "text-[var(--text-muted)] hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-[var(--border-subtle)]">
              {isConnected ? (
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-center" onClick={disconnect}>
                    <LogOut className="w-4 h-4" />
                    {es.nav.disconnect}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full justify-center"
                  onClick={connect}
                  disabled={isConnecting}
                  icon={<Wallet className="w-4 h-4" />}
                >
                  {isConnecting ? es.nav.connecting : es.nav.connect}
                </Button>
              )}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
