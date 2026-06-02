import { Sparkles } from "lucide-react";

import { StubPage } from "@/components/StubPage";

export default function AIToolsPage() {
  return (
    <StubPage
      title="AI Tools"
      subtitle="Your adviser copilot"
      Icon={Sparkles}
      description="AI Assistant chat, lead qualifier, document checker, case summariser, email drafter, compliance checker — all on top of OpenAI."
    />
  );
}
