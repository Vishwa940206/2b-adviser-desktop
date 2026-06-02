export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur sticky top-0 z-10 px-8 py-5 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
