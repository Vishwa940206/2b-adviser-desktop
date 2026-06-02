import { FileText } from "lucide-react";

import { StubPage } from "@/components/StubPage";

export default function DocumentsPage() {
  return (
    <StubPage
      title="Documents"
      subtitle="Files uploaded across all clients and applications"
      Icon={FileText}
      description="Filter by client, case, type (ID / payslip / bank statement). Open with signed URLs. Bulk-classify pending docs with AI."
    />
  );
}
