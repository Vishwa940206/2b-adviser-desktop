import { LucideIcon } from "lucide-react";

import { PageHeader } from "./PageHeader";

export function StubPage({
  title,
  subtitle,
  Icon,
  description,
}: {
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  description: string;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="p-8">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
            <Icon size={24} className="text-[var(--primary-dark)]" />
          </div>
          <div className="font-bold text-lg mt-4">{title} — coming up next</div>
          <p className="text-sm text-[var(--text-secondary)] mt-2">{description}</p>
        </div>
      </div>
    </>
  );
}
