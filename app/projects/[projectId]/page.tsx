"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WorkerCard } from "@/components/worker-card";
import { AddWorkerDialog } from "@/components/add-worker-dialog";
import { DateNavigator } from "@/components/date-navigator";
import { StatusBadge } from "@/components/status-badge";
import { ExportButton } from "@/components/export-button";
import { listWorkersByProject } from "@/lib/actions/worker-actions";
import { getProject } from "@/lib/actions/project-actions";
import { format } from "date-fns";

interface WorkerWithAttendance {
  id: string;
  name: string;
  workerType: string;
  hourlyWage: number;
  attendances: Array<{
    id: string;
    status: string;
    timeBlocks: Array<{ id: string; fromTime: string; toTime: string; hoursWorked: number }>;
  }>;
}

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [project, setProject] = useState<{ id: string; name: string; status: string } | null>(null);
  const [workers, setWorkers] = useState<WorkerWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, w] = await Promise.all([
        getProject(params.projectId),
        listWorkersByProject(params.projectId, date),
      ]);
      if (p) {
        setProject({ id: p.id, name: p.name, status: p.status });
      }
      setWorkers(w as unknown as WorkerWithAttendance[]);
      setLoading(false);
    }
    load();
  }, [params.projectId, date]);

  const dateStr = format(date, "yyyy-MM-dd");

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <StatusBadge status={project.status as "ACTIVE" | "COMPLETED" | "ARCHIVED"} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export CSV"
            showDropdown={false}
            onExportThisMonth={() => {
              window.open(`/api/export/project/${params.projectId}`, "_blank");
            }}
          />
          <AddWorkerDialog projectId={params.projectId} />
        </div>
      </header>

      <div className="flex justify-center mb-6">
        <DateNavigator date={date} onDateChange={setDate} />
      </div>

      {workers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            No workers added to this project yet.
          </p>
          <AddWorkerDialog projectId={params.projectId} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              workerId={worker.id}
              projectId={params.projectId}
              name={worker.name}
              workerType={worker.workerType}
              hourlyWage={Number(worker.hourlyWage)}
              attendance={worker.attendances[0] || null}
              dateStr={dateStr}
            />
          ))}
        </div>
      )}
    </div>
  );
}
