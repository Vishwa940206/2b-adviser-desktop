import { humanizeEnum } from "@/lib/format";

const PALETTE: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "#EBF4FE", text: "#1A7DD4" },
  under_review: { bg: "#FEF3C7", text: "#B45309" },
  approved: { bg: "#DCFCE7", text: "#15803D" },
  rejected: { bg: "#FEE2E2", text: "#B91C1C" },
  new: { bg: "#EBF4FE", text: "#1A7DD4" },
  qualified: { bg: "#DCFCE7", text: "#15803D" },
  active: { bg: "#DCFCE7", text: "#15803D" },
  inactive: { bg: "#F1F5F9", text: "#475569" },
  discovery: { bg: "#EBF4FE", text: "#1A7DD4" },
  documents: { bg: "#FEF3C7", text: "#B45309" },
  application: { bg: "#EDE9FE", text: "#6D28D9" },
  review: { bg: "#CFFAFE", text: "#0E7490" },
  completed: { bg: "#DCFCE7", text: "#15803D" },
  default: { bg: "#F1F5F9", text: "#475569" },
};

export function StatusBadge({ value, label }: { value: string | null; label?: string }) {
  const key = (value ?? "default").toLowerCase();
  const p = PALETTE[key] ?? PALETTE.default;
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: p.bg, color: p.text }}
    >
      {label ?? humanizeEnum(value)}
    </span>
  );
}
