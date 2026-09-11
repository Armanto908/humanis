import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { PersonAvatar } from "@/components/person-avatar";
import { DEMO_PERSONAS, EMPLOYEES } from "@/lib/seed";
import { ROLE_LABEL } from "@/lib/format";
import { useHumanis } from "@/lib/store";

export const Route = createFileRoute("/masuk")({ component: Masuk });

function Masuk() {
  const navigate = useNavigate();
  const setPersona = useHumanis((s) => s.setPersona);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-10 md:py-16">
      <Logo />
      <h1 className="mt-10 font-display text-4xl font-medium tracking-tight">Masuk ke portal demo</h1>
      <p className="mt-3 max-w-lg text-muted">
        Pilih peran. Data milik studio fiktif PT Arunika Digital — tidak perlu akun.
      </p>
      <div className="mt-10 grid gap-3">
        {DEMO_PERSONAS.map((p) => {
          const person = EMPLOYEES.find((e) => e.id === p.userId);
          if (!person) return null;
          return (
            <button
              key={p.role}
              onClick={() => {
                setPersona(p.role, p.userId);
                void navigate({ to: "/app" });
              }}
              className="flex items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-card transition-[box-shadow,transform] duration-150 hover:shadow-card-hover active:scale-[0.99]"
            >
              <PersonAvatar person={person} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium tracking-wide text-muted uppercase">
                  {ROLE_LABEL[p.role]}
                </span>
                <span className="mt-0.5 block font-display text-xl">{person.name}</span>
                <span className="mt-1 block text-sm text-muted">{p.blurb}</span>
              </span>
              <ArrowRight className="size-4 text-faint" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
