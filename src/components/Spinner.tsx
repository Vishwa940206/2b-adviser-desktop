export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 justify-center py-10 text-sm ${className ?? "text-[var(--text-secondary)]"}`}>
      <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      {label ?? "Loading…"}
    </div>
  );
}
