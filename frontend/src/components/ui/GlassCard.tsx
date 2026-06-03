"use client";

import { motion, HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover } from "@/lib/motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: "default" | "highlight";
}

export function GlassCard({
  children,
  className,
  hover = true,
  variant = "default",
  ...props
}: GlassCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative rounded-xl border bg-bg-elevated shadow-[var(--shadow-card)]",
        "border-[var(--border-subtle)] transition-colors duration-200",
        variant === "highlight" && "border-l-2 border-l-emerald-500 border-y-[var(--border-subtle)] border-r-[var(--border-subtle)]",
        className,
      )}
      whileHover={hover && !reducedMotion ? cardHover : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Alias for the redesigned surface card */
export const SurfaceCard = GlassCard;
