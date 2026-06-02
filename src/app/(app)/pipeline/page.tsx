import { PageHeader } from "@/components/PageHeader";

export default function PipelinePage() {
  return (
    <>
      <PageHeader title="Pipeline" subtitle="Your live mortgage and protection cases" />
      <div className="p-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <div className="text-4xl mb-3">💼</div>
          <div className="font-bold text-lg">Kanban-style pipeline — coming up next</div>
          <div className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
            Drag cases between stages: discovery → documents → application → review → completed.
          </div>
        </div>
      </div>
    </>
  );
}
