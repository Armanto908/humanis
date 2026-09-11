import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-accent" />
      <path
        d="M10 22V10.5h2.2v4.4H19.8V10.5H22V22h-2.2v-5.1H12.2V22H10Z"
        fill="currentColor"
        className="text-accent-fg"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark />
      <span className="font-display text-xl font-medium tracking-tight">Humanis</span>
    </span>
  );
}
