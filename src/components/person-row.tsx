import { Link } from "@tanstack/react-router";
import { PersonAvatar } from "@/components/person-avatar";
import { DEPARTMENT_LABEL } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PersonRow({
  person,
  extra,
  link = false,
  className,
}: {
  person: Employee;
  extra?: string;
  link?: boolean;
  className?: string;
}) {
  const body = (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <PersonAvatar person={person} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{person.name}</p>
        <p className="truncate text-xs text-muted">
          {person.title} · {DEPARTMENT_LABEL[person.department]}
          {extra ? ` · ${extra}` : ""}
        </p>
      </div>
    </div>
  );
  if (!link) return body;
  return (
    <Link
      to="/app/employees/$id"
      params={{ id: person.id }}
      className="rounded-xl p-1 transition-colors hover:bg-surface-2"
    >
      {body}
    </Link>
  );
}
