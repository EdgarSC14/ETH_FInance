"use client";

import { LayoutDashboard, Target, Send, Bot, Wallet, LogOut, Landmark, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, AppView } from "@/store/useAppStore";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { scrollToSection, scrollToLanding } from "@/hooks/useScrollNavigation";
import { WalletMenu } from "@/components/layout/WalletMenu";
import { es } from "@/lib/i18n/es";

const NAV_ITEMS: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: es.nav.dashboard, icon: LayoutDashboard },
  { id: "goals", label: es.nav.goals, icon: Target },
  { id: "payments", label: es.nav.payments, icon: Send },
  { id: "copilot", label: es.nav.copilot, icon: Bot },
];

interface TopNavProps {
  scrollRootRef: React.RefObject<HTMLElement | null>;
}

export function TopNav({ scrollRootRef }: TopNavProps) {
  const { pageMode, activeView, goToLanding, navSolid, setMobileNavOpen } = useAppStore();
  const { isConnected, connect, disconnect, isConnecting } = useWallet();

  const handleHome = () => {
    goToLanding();
    scrollToLanding(scrollRootRef.current);
  };

  const selectView = (id: AppView) => {
    scrollToSection(scrollRootRef.current, id);
  };

  const headerSolid = navSolid || pageMode === "app";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        headerSolid
          ? "bg-bg-elevated/95 backdrop-blur-md"
          : "bg-[var(--bg-base)]/85 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "page-shell h-[var(--nav-height)] border-b flex items-center gap-3 sm:gap-4 lg:gap-5",
          headerSolid ? "border-[var(--border-subtle)]" : "border-[var(--border-subtle)]/50",
        )}
      >
        <button
          type="button"
          onClick={handleHome}
          className="flex items-center gap-3 flex-shrink-0"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Landmark className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="hidden md:block font-semibold text-lg text-[var(--text-primary)] tracking-tight">
            {es.nav.brand}
          </span>
        </button>

        <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-4 xl:gap-6 flex-1 min-w-0">
          {pageMode === "app" && (
            <Badge
              variant={isConnected ? "success" : "warning"}
              className="hidden lg:inline-flex flex-shrink-0"
              title={isConnected ? es.mode.onChainHint : es.mode.demoHint}
            >
              {isConnected ? es.mode.onChain : es.mode.demo}
            </Badge>
          )}
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id && pageMode !== "landing";
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectView(id)}
                className={cn(
                  "flex flex-col items-stretch gap-1.5 px-4 lg:px-5 pt-2 pb-1.5 rounded-xl text-sm lg:text-[15px] font-medium transition-colors whitespace-nowrap min-w-0",
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]",
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {label}
                </span>
                <span
                  className={cn(
                    "h-0.5 w-full rounded-full transition-all duration-200",
                    isActive ? "bg-emerald-500" : "bg-transparent",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 ml-auto">
          {pageMode === "app" && (
            <Badge
              variant={isConnected ? "success" : "warning"}
              className="md:hidden flex-shrink-0"
              title={isConnected ? es.mode.onChainHint : es.mode.demoHint}
            >
              {isConnected ? es.mode.onChain : es.mode.demo}
            </Badge>
          )}
          {isConnected ? (
            <>
              <div className="hidden sm:block">
                <WalletMenu />
              </div>

              <button
                type="button"
                onClick={disconnect}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                aria-label={es.nav.disconnect}
              >
                <LogOut className="w-4 h-4" />
                <span>{es.nav.disconnect}</span>
              </button>
            </>
          ) : (
            <Button
              size="md"
              onClick={connect}
              disabled={isConnecting}
              className="hidden sm:inline-flex"
              icon={<Wallet className="w-4 h-4" />}
            >
              {isConnecting ? es.nav.connecting : es.nav.connect}
            </Button>
          )}

          <button
            type="button"
            className="md:hidden p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
            onClick={() => setMobileNavOpen(true)}
            aria-label={es.nav.openMenu}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
