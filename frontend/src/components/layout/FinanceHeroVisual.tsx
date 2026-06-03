import { es } from "@/lib/i18n/es";

/** Ilustración inline — evita problemas de carga con next/image + SVG */
export function FinanceHeroVisual({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
    >
      <rect width="800" height="600" fill="#0c100e" />
      <rect width="800" height="600" fill="url(#heroGrad)" opacity="0.9" />
      <defs>
        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#050807" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M60 430 L180 330 L300 390 L420 230 L540 290 L660 150 L740 190"
        stroke="url(#lineGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 430 L180 330 L300 390 L420 230 L540 290 L660 150 L740 190 L740 520 L60 520 Z"
        fill="url(#lineGrad)"
        fillOpacity="0.08"
      />
      <circle cx="660" cy="150" r="7" fill="#10b981" />
      <circle cx="420" cy="230" r="5" fill="#34d399" />
      <circle cx="180" cy="330" r="4" fill="#6ee7b7" fillOpacity="0.85" />
      <text x="48" y="100" fill="#f4f7f5" fontSize="26" fontWeight="600" fontFamily="system-ui,sans-serif">
        {es.hero.visualTitle}
      </text>
      <text x="48" y="132" fill="rgba(244,247,245,0.45)" fontSize="13" fontFamily="system-ui,sans-serif">
        {es.hero.visualSubtitle}
      </text>
    </svg>
  );
}
