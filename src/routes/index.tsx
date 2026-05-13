import { createFileRoute } from "@tanstack/react-router";
import ElecTrackApp from "@/components/electrack/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ElecTrack — จัดการงานช่างไฟ" },
      { name: "description", content: "แอปจัดการไซต์งานช่างไฟ บันทึกงาน ค่าใช้จ่าย ปฏิทิน และสรุปกำไร" },
    ],
  }),
  component: ElecTrackApp,
});
