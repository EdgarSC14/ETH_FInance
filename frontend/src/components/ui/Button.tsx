"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variants = {
  primary: "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40",
  secondary: "bg-transparent hover:bg-white/5 text-[var(--text-primary)] border-[var(--border-subtle)]",
  ghost: "bg-transparent hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent",
  danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25",
};

const sizes = {
  sm: "px-3.5 py-2 text-sm rounded-lg min-h-[2.25rem]",
  md: "px-5 py-2.5 text-sm rounded-lg min-h-[2.5rem]",
  lg: "px-6 py-3 text-base rounded-xl min-h-[2.75rem]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center font-medium border backdrop-blur-sm",
        loading || icon ? "gap-2" : "",
        "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {(loading || icon) && (
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}
