import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "income" | "expense" | "neutral";
  className?: string;
  title?: string;
}

const variants = {
  default: "bg-white/5 text-[var(--text-muted)] border-[var(--border-subtle)]",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  danger: "bg-red-500/10 text-red-400 border-red-500/25",
  info: "bg-white/5 text-[var(--text-muted)] border-[var(--border-subtle)]",
  income: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  expense: "bg-red-500/10 text-red-400 border-red-500/25",
  neutral: "bg-white/5 text-[var(--text-muted)] border-[var(--border-subtle)]",
};

export function Badge({ children, variant = "default", className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
