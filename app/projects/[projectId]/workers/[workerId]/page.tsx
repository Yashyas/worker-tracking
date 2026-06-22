"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { MonthTabs } from "@/components/month-tabs";
import { ExportButton } from "@/components/export-button";
import { EditWorkerDialog } from "@/components/edit-worker-dialog";
import { MonthlyAttendanceTable } from "@/components/monthly-attendance-table";
import { getWorker, getWorkerMonthlyData, getWorkerAvailableMonths } from "@/lib/actions/worker-actions";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function WorkerPage() {
  const params = useParams<{ projectId: string; workerId: string }>();
  const [worker, setWorker] = useState<{
    id: string;
    name: string;
    workerType: string;
    hourlyWage: number;
    project: { id: string; name: string; status: string };
  } | null>(null);
  const [availableMonths, setAvailableMonths] = useState<Array<{ year: number; month: number; label: string }>>([]);
  const [activeMonth, setActiveMonth] = useState("");
  const [attendances, setAttendances] = useState<Map<string, { status: string; timeBlocks: Array<{ id: string; fromTime: string; toTime: string; hoursWorked: number }> }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const w = await getWorker(params.workerId);
      if (!w) {
        setLoading(false);
        return;
      }
      setWorker(w as any);

      const months = await getWorkerAvailableMonths(params.workerId);
      const now = new Date();
      const currentLabel = format(now, "MMMM yyyy");
      const monthList = months.length > 0
        ? months.map((m) => ({ ...m, label: format(new Date(m.year, m.month), "MMMM yyyy") }))
        : [{ year: now.getFullYear(), month: now.getMonth(), label: currentLabel }];

      setAvailableMonths(monthList);

      const defaultMonth = monthList.find((m) => m.label === currentLabel) || monthList[0];
      setActiveMonth(defaultMonth.label);

      const { attendances: atts, daysInMonth } = await getWorkerMonthlyData(
        params.workerId,
        defaultMonth.year,
        defaultMonth.month
      );
      const map = new Map<string, { status: string; timeBlocks: any[] }>();
      atts.forEach((a: any) => {
        const dateStr = format(new Date(a.date), "yyyy-MM-dd");
        map.set(dateStr, { status: a.status, timeBlocks: a.timeBlocks });
      });
      setAttendances(map);
      setLoading(false);
    }
    load();
  }, [params.workerId]);

  async function handleMonthChange(value: string) {
    setActiveMonth(value);
    setLoading(true);
    const month = availableMonths.find((m) => m.label === value);
    if (!month) return;
    const { attendances: atts } = await getWorkerMonthlyData(params.workerId, month.year, month.month);
    const map = new Map<string, { status: string; timeBlocks: any[] }>();
    atts.forEach((a: any) => {
      const dateStr = format(new Date(a.date), "yyyy-MM-dd");
      map.set(dateStr, { status: a.status, timeBlocks: a.timeBlocks });
    });
    setAttendances(map);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-6">
        <p className="text-muted-foreground">Worker not found.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const activeMonthData = availableMonths.find((m) => m.label === activeMonth);
  const year = activeMonthData?.year || new Date().getFullYear();
  const month = activeMonthData?.month || new Date().getMonth();

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(new Date(year, month)),
    end: endOfMonth(new Date(year, month)),
  });

  const daysPresent = daysInMonth.filter((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const att = attendances.get(dateStr);
    return att?.status === "PRESENT";
  }).length;

  let totalHoursMonth = 0;
  let totalWageMonth = 0;
  attendances.forEach((att) => {
    if (att.status === "PRESENT") {
      const hrs = att.timeBlocks.reduce((sum, tb) => sum + Number(tb.hoursWorked), 0);
      totalHoursMonth += hrs;
      totalWageMonth += hrs * Number(worker.hourlyWage);
    }
  });

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${params.projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{worker.name}</h1>
              <EditWorkerDialog
                workerId={worker.id}
                name={worker.name}
                workerType={worker.workerType}
                hourlyWage={Number(worker.hourlyWage)}
              />
              {worker.workerType && (
                <StatusBadge status={worker.project.status as "ACTIVE" | "COMPLETED" | "ARCHIVED"} />
              )}
            </div>
            {worker.workerType && (
              <p className="text-sm text-muted-foreground">
                {worker.workerType} · ₹{Number(worker.hourlyWage).toFixed(2)}/hr
              </p>
            )}
          </div>
        </div>
        <ExportButton
          label="Export CSV"
          onExportThisMonth={() => {
            window.open(
              `/api/export/worker/${params.workerId}?year=${year}&month=${month + 1}`,
              "_blank"
            );
          }}
          onExportAll={() => {
            availableMonths.forEach((m) => {
              window.open(
                `/api/export/worker/${params.workerId}?year=${m.year}&month=${m.month + 1}`,
                "_blank"
              );
            });
          }}
        />
      </header>

      {availableMonths.length > 0 && (
        <div className="mb-6">
          <MonthTabs
            months={availableMonths}
            activeMonth={activeMonth}
            onMonthChange={handleMonthChange}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{totalHoursMonth.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Hours This Month</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">₹{totalWageMonth.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">Wage This Month</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{daysPresent}</p>
          <p className="text-sm text-muted-foreground">Days Present</p>
        </div>
      </div>

      <MonthlyAttendanceTable
        year={year}
        month={month}
        attendances={attendances}
        hourlyWage={Number(worker.hourlyWage)}
      />
    </div>
  );
}
