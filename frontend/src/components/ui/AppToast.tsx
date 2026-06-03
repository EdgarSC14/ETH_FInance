"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const AUTO_DISMISS_MS = 5000;

export function AppToast() {
  const toast = useAppStore((s) => s.toast);
  const dismissToast = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismissToast, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [toast, dismissToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[min(92vw,28rem)] px-4 py-3 rounded-xl border border-red-500/30 bg-bg-elevated/95 backdrop-blur-md shadow-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-[var(--text-primary)] leading-snug flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={dismissToast}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
