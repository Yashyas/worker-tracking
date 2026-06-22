import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@prisma/client";

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function AttendanceBadge({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === "PRESENT") {
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Present</Badge>;
  }
  return <Badge className="bg-rose-500 hover:bg-rose-600 text-white">Absent</Badge>;
}
