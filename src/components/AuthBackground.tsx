export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#0D0B14]">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="auth-grid" />
      <div className="relative z-10 w-full flex items-center justify-center">{children}</div>
    </div>
  );
}
