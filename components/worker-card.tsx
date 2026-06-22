"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceToggle } from "./attendance-toggle";
import { TimeBlockChip } from "./time-block-chip";
import { TimeBlockPicker } from "./time-block-picker";
import { ConfirmDialog } from "./confirm-dialog";
import { EditWorkerDialog } from "./edit-worker-dialog";
import { calculateTotalHours, calculateDayWage, formatCurrency } from "@/lib/wages";
import { markAttendance, addTimeBlock, deleteTimeBlock, confirmMarkAbsent } from "@/lib/actions/attendance-actions";
import { useRouter } from "next/navigation";

interface WorkerCardProps {
  workerId: string;
  projectId: string;
  name: string;
  workerType: string;
  hourlyWage: number;
  attendance: {
    id: string;
    status: string;
    timeBlocks: Array<{ id: string; fromTime: string; toTime: string; hoursWorked: number }>;
  } | null;
  dateStr: string;
}

export function WorkerCard({ workerId, projectId, name, workerType, hourlyWage, attendance, dateStr }: WorkerCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);
  const totalHours = attendance ? calculateTotalHours(attendance.timeBlocks) : 0;
  const dayWage = calculateDayWage(totalHours, hourlyWage);

  async function handleToggle(value: string) {
    if (value === "ABSENT" && attendance?.timeBlocks && attendance.timeBlocks.length > 0) {
      setPendingToggle(value);
      setConfirmOpen(true);
      return;
    }
    await markAttendance(workerId, dateStr, value as "PRESENT" | "ABSENT", true);
    router.refresh();
  }

  async function handleConfirmAbsent() {
    setConfirmOpen(false);
    await confirmMarkAbsent(workerId, dateStr);
    router.refresh();
  }

  async function handleAddTimeBlock(fromTime: string, toTime: string) {
    await addTimeBlock(workerId, dateStr, fromTime, toTime);
    router.refresh();
  }

  async function handleDeleteTimeBlock(timeBlockId: string) {
    await deleteTimeBlock(timeBlockId);
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <Link href={`/projects/${projectId}/workers/${workerId}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {workerType && (
                  <Badge variant="secondary" className="text-xs">{workerType}</Badge>
                )}
                <span className="text-xs text-muted-foreground">₹{Number(hourlyWage).toFixed(2)}/hr</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <EditWorkerDialog
                workerId={workerId}
                name={name}
                workerType={workerType}
                hourlyWage={hourlyWage}
              />
              <AttendanceToggle
                value={attendance?.status || null}
                onValueChange={handleToggle}
              />
            </div>
          </div>

          {attendance?.status === "PRESENT" && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {attendance.timeBlocks.map((block) => (
                  <TimeBlockChip
                    key={block.id}
                    fromTime={block.fromTime}
                    toTime={block.toTime}
                    onDelete={() => handleDeleteTimeBlock(block.id)}
                  />
                ))}
                <TimeBlockPicker onAdd={handleAddTimeBlock} />
              </div>
              <p className="text-sm font-medium text-right">
                Today: {totalHours.toFixed(1)} hrs · {formatCurrency(dayWage)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Mark Absent?"
        description={`This will remove ${attendance?.timeBlocks.length} recorded time block(s) for ${dateStr}. Continue?`}
        onConfirm={handleConfirmAbsent}
      />
    </>
  );
}
