"use client";

import { RefObject, useEffect } from "react";
import { useAppStore, AppView } from "@/store/useAppStore";

const APP_SECTIONS: AppView[] = ["dashboard", "goals", "payments", "copilot"];

/** Bloquea el scroll spy mientras un clic del nav hace scroll a una sección */
const scrollNavigationIntent = { current: null as AppView | null };
let intentClearTimer: ReturnType<typeof setTimeout> | null = null;

const NAV_HEIGHT_FALLBACK_PX = 72;

/** Altura real del nav en px (parseInt falla con clamp() en CSS vars) */
function getNavHeightPx(): number {
  const header = document.querySelector("header");
  if (header) {
    const height = header.getBoundingClientRect().height;
    if (Number.isFinite(height) && height > 0) return Math.round(height);
  }

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;height:var(--nav-height,4.5rem)";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();

  return Number.isFinite(height) && height > 0
    ? Math.round(height)
    : NAV_HEIGHT_FALLBACK_PX;
}

function getScrollRoot(scrollRootRef: RefObject<HTMLElement | null>) {
  return scrollRootRef.current ?? document.getElementById("scroll-root");
}

function scheduleIntentClear() {
  if (intentClearTimer) clearTimeout(intentClearTimer);
  intentClearTimer = setTimeout(() => {
    scrollNavigationIntent.current = null;
    intentClearTimer = null;
  }, 900);
}

export function beginScrollToSection(view: AppView) {
  scrollNavigationIntent.current = view;
  scheduleIntentClear();
}

export function clearScrollNavigationIntent() {
  scrollNavigationIntent.current = null;
  if (intentClearTimer) {
    clearTimeout(intentClearTimer);
    intentClearTimer = null;
  }
}

function pickVisibleSection(ratios: Map<string, number>): AppView | null {
  let best: AppView | null = null;
  let bestRatio = 0;

  for (const id of APP_SECTIONS) {
    const ratio = ratios.get(`section-${id}`) ?? 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = id;
    }
  }

  return bestRatio > 0.05 ? best : null;
}

/** Actualiza nav, modo landing/app y sección activa según el scroll */
export function useScrollSectionSync(scrollRootRef: RefObject<HTMLElement | null>) {
  const setNavSolid = useAppStore((s) => s.setNavSolid);
  const setPageMode = useAppStore((s) => s.setPageMode);
  const setActiveView = useAppStore((s) => s.setActiveView);

  useEffect(() => {
    const attach = (root: HTMLElement) => {
      const navH = getNavHeightPx();
      const sectionRatios = new Map<string, number>();
      let landingRatio = 0;

      const applyState = () => {
        const intent = scrollNavigationIntent.current;

        if (intent) {
          const state = useAppStore.getState();
          if (state.pageMode !== "app") setPageMode("app");
          if (state.activeView !== intent) setActiveView(intent);
          setNavSolid(true);
          return;
        }

        if (landingRatio > 0.55) {
          const state = useAppStore.getState();
          if (state.pageMode !== "landing") setPageMode("landing");
          setNavSolid(false);
          return;
        }

        const visible = pickVisibleSection(sectionRatios);
        if (!visible) return;

        const state = useAppStore.getState();
        if (state.pageMode !== "app") setPageMode("app");
        if (state.activeView !== visible) setActiveView(visible);
        setNavSolid(true);
      };

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            sectionRatios.set(entry.target.id, entry.intersectionRatio);
          });
          applyState();
        },
        {
          root,
          rootMargin: `-${navH}px 0px -50% 0px`,
          threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
        },
      );

      const landingObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            landingRatio = entry.intersectionRatio;
          });
          applyState();
        },
        { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
      );

      const landing = document.getElementById("landing");
      if (landing) landingObserver.observe(landing);

      for (const id of APP_SECTIONS) {
        const el = document.getElementById(`section-${id}`);
        if (el) sectionObserver.observe(el);
      }

      const onScrollEnd = () => {
        scrollNavigationIntent.current = null;
        if (intentClearTimer) {
          clearTimeout(intentClearTimer);
          intentClearTimer = null;
        }
        applyState();
      };

      root.addEventListener("scrollend", onScrollEnd);

      applyState();

      return () => {
        sectionObserver.disconnect();
        landingObserver.disconnect();
        root.removeEventListener("scrollend", onScrollEnd);
        clearScrollNavigationIntent();
      };
    };

    let scroller = getScrollRoot(scrollRootRef);
    if (!scroller) {
      const retryId = window.setTimeout(() => {
        scroller = getScrollRoot(scrollRootRef);
        if (scroller) attach(scroller);
      }, 0);
      return () => window.clearTimeout(retryId);
    }

    return attach(scroller);
  }, [scrollRootRef, setNavSolid, setPageMode, setActiveView]);
}

export function scrollToSection(scrollRoot: HTMLElement | null, view: AppView) {
  const root = scrollRoot ?? document.getElementById("scroll-root");
  const section = document.getElementById(`section-${view}`);
  if (!root || !section) return;

  useAppStore.getState().openAppView(view);
  beginScrollToSection(view);

  const rootRect = root.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();
  const top = root.scrollTop + (sectionRect.top - rootRect.top);

  root.scrollTo({ top, behavior: "smooth" });
}

export function scrollToLanding(scrollRoot: HTMLElement | null) {
  const root = scrollRoot ?? document.getElementById("scroll-root");
  const landing = document.getElementById("landing");
  clearScrollNavigationIntent();

  if (landing && root) {
    const rootRect = root.getBoundingClientRect();
    const landingRect = landing.getBoundingClientRect();
    const top = root.scrollTop + (landingRect.top - rootRect.top);
    root.scrollTo({ top, behavior: "smooth" });
    return;
  }

  root?.scrollTo({ top: 0, behavior: "smooth" });
}
