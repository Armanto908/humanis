import { Link } from "@tanstack/react-router";
import { PersonAvatar } from "@/components/person-avatar";
import { DEPARTMENT_LABEL } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

const INDENT = ["pl-2", "pl-7", "pl-12", "pl-16", "pl-20"] as const;

function NodeRow({ person, depth }: { person: Employee; depth: number }) {
  return (
    <Link
      to="/app/employees/$id"
      params={{ id: person.id }}
      className={cn(
        "flex items-center gap-3 rounded-2xl py-2.5 pr-3 transition-colors hover:bg-surface-2",
        INDENT[Math.min(depth, INDENT.length - 1)],
      )}
    >
      <PersonAvatar person={person} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{person.name}</span>
        <span className="block truncate text-xs text-muted">
          {person.title} · {DEPARTMENT_LABEL[person.department]}
        </span>
      </span>
    </Link>
  );
}

function Branch({ person, people, depth }: { person: Employee; people: Employee[]; depth: number }) {
  const reports = people.filter((e) => e.managerId === person.id);
  return (
    <div>
      <NodeRow person={person} depth={depth} />
      {reports.length > 0 ? (
        <div className={cn("ml-6 border-l border-line", depth === 0 ? "ml-7" : "ml-10")}>
          {reports.map((child) => (
            <Branch key={child.id} person={child} people={people} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OrgChart({ people }: { people: Employee[] }) {
  const roots = people.filter((e) => !e.managerId || !people.some((p) => p.id === e.managerId));
  return (
    <div className="space-y-1">
      {roots.map((root) => (
        <Branch key={root.id} person={root} people={people} depth={0} />
      ))}
    </div>
  );
}
