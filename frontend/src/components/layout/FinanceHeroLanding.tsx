"use client";

import { ChevronDown } from "lucide-react";
import { RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { scrollToSection } from "@/hooks/useScrollNavigation";
import { FinanceHeroVisual } from "@/components/layout/FinanceHeroVisual";
import { es } from "@/lib/i18n/es";

interface FinanceHeroLandingProps {
  scrollRootRef: RefObject<HTMLElement | null>;
}

export function FinanceHeroLanding({ scrollRootRef }: FinanceHeroLandingProps) {
  const handleExplore = () => {
    scrollToSection(scrollRootRef.current, "dashboard");
  };

  return (
    <section id="landing" className="scroll-section relative w-full">
      <div className="page-shell scroll-section-body border-b border-[var(--border-subtle)] pb-8 sm:pb-10 justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full flex-1">
          <div className="flex flex-col justify-center text-center lg:text-left order-1">
            <p className="text-label mb-3 sm:mb-4">{es.hero.label}</p>
            <h1 className="text-display text-[var(--text-primary)] mb-4 max-w-xl mx-auto lg:mx-0">
              {es.hero.titleLine1}
              <br />
              <span className="text-emerald-400">{es.hero.titleHighlight}</span>
            </h1>
            <p className="text-ui text-[var(--text-muted)] max-w-md mx-auto lg:mx-0 mb-8">
              {es.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" onClick={handleExplore}>
                {es.hero.ctaPrimary}
              </Button>
              <Button size="lg" variant="secondary" onClick={handleExplore}>
                {es.hero.ctaSecondary}
              </Button>
            </div>
          </div>

          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[420px] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-bg-muted order-2">
            <FinanceHeroVisual className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0 pointer-events-none bg-linear-to-t from-[var(--bg-base)]/70 via-transparent to-transparent lg:bg-linear-to-l lg:from-[var(--bg-base)]/50"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleExplore}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-emerald-400 transition-colors z-10"
        aria-label={es.hero.scrollAria}
      >
        <span className="text-xs uppercase tracking-widest">{es.hero.scroll}</span>
        <ChevronDown className="w-5 h-5 motion-safe:animate-bounce" />
      </button>
    </section>
  );
}
