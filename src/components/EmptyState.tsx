export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-bold text-lg">{title}</div>
      {description ? (
        <div className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
