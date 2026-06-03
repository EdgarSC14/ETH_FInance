"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { FinanceHeroLanding } from "@/components/layout/FinanceHeroLanding";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { AllocationChart } from "@/components/dashboard/AllocationChart";
import { TransactionFeed } from "@/components/dashboard/TransactionFeed";
import { ReputationCard } from "@/components/dashboard/ReputationCard";
import { DepositModal } from "@/components/dashboard/DepositModal";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";
import { GoalsPanel } from "@/components/goals/GoalsPanel";
import { AICopilot } from "@/components/copilot/AICopilot";
import { PaymentsPanel } from "@/components/payments/PaymentsPanel";
import { useOnChainSync } from "@/hooks/useOnChainSync";
import { useSyncOnChainReputation } from "@/hooks/useSyncOnChainReputation";
import { AppToast } from "@/components/ui/AppToast";
import { useScrollSectionSync } from "@/hooks/useScrollNavigation";
import { staggerContainer } from "@/lib/motion";
import { es } from "@/lib/i18n/es";
import { AppView } from "@/store/useAppStore";

const SECTIONS: { id: AppView; title: string; subtitle: string }[] = [
  { id: "dashboard", ...es.views.dashboard },
  { id: "goals", ...es.views.goals },
  { id: "payments", ...es.views.payments },
  { id: "copilot", ...es.views.copilot },
];

function DashboardView({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
      variants={reducedMotion ? undefined : staggerContainer}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? false : "visible"}
    >
      <BalanceCard />
      <HealthScoreCard />
      <ReputationCard />
      <TransactionFeed className="col-span-full lg:col-span-1 lg:min-h-[320px] lg:max-h-none" />
      <AllocationChart />
    </motion.div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="section-header">
      <h2 className="text-section-title text-[var(--text-primary)]">{title}</h2>
      <p className="section-subtitle">{subtitle}</p>
    </header>
  );
}

export default function HomePageClient() {
  useOnChainSync();
  useSyncOnChainReputation();
  const reducedMotion = useReducedMotion();

  const scrollRootRef = useRef<HTMLDivElement>(null);

  useScrollSectionSync(scrollRootRef);

  return (
    <div className="h-dvh flex flex-col app-bg overflow-hidden" suppressHydrationWarning>
      <TopNav scrollRootRef={scrollRootRef} />
      <MobileNavMenu scrollRootRef={scrollRootRef} />

      <div
        id="scroll-root"
        ref={scrollRootRef}
        className="scroll-sections flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-smooth"
      >
        <FinanceHeroLanding scrollRootRef={scrollRootRef} />

        {SECTIONS.map(({ id, title, subtitle }) => (
          <section
            key={id}
            id={`section-${id}`}
            className="scroll-section relative page-shell w-full border-t border-[var(--border-subtle)] box-border"
          >
            <div className="scroll-section-body pb-10 sm:pb-12">
              <SectionHeader title={title} subtitle={subtitle} />
              <div className="flex-1 min-h-0">
                {id === "dashboard" && <DashboardView reducedMotion={!!reducedMotion} />}
                {id === "goals" && <GoalsPanel />}
                {id === "payments" && <PaymentsPanel />}
                {id === "copilot" && <AICopilot />}
              </div>
            </div>
          </section>
        ))}
      </div>

      <DepositModal />
      <WithdrawModal />
      <AppToast />
    </div>
  );
}
