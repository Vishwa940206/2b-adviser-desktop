import { Calendar } from "lucide-react";

import { StubPage } from "@/components/StubPage";

export default function CalendarPage() {
  return (
    <StubPage
      title="Calendar"
      subtitle="Your appointments and reviews"
      Icon={Calendar}
      description="A week + month view tied to the appointments table — book meetings, set reminders, sync to Google/Outlook later."
    />
  );
}
