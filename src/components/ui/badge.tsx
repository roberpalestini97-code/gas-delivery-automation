import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  default: "bg-[var(--surface-2)] text-[var(--foreground)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  success: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  muted: "bg-slate-100 text-slate-600",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}