import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/types";

const TONES = [
  "bg-accent text-accent-fg",
  "bg-ink text-accent-fg",
  "bg-accent-soft text-accent",
  "bg-bg-warm text-ink",
  "bg-accent-mid text-accent-fg",
  "bg-ink-soft text-accent-fg",
] as const;

export function PersonAvatar({
  person,
  size = "md",
  className,
}: {
  person: Pick<Employee, "initials" | "tone" | "name">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-10 text-sm";
  return (
    <div
      aria-hidden
      title={person.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        dim,
        TONES[person.tone % TONES.length],
        className,
      )}
    >
      {person.initials}
    </div>
  );
}
