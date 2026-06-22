import { ProjectCard } from "@/components/project-card";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { listProjects, updateProjectStatus } from "@/lib/actions/project-actions";
import type { ProjectStatus } from "@/lib/generated/prisma/enums";
import Link from "next/link";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

async function handleStatusChange(projectId: string, status: ProjectStatus) {
  "use server";
  await updateProjectStatus(projectId, status);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const activeTab = sp.status?.toUpperCase() || "ACTIVE";

  const filter = activeTab === "ALL" ? undefined : (activeTab as ProjectStatus);
  const projects = await listProjects(filter);
  const showEmptyState = projects.length === 0;

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Worker Shift Tracker</h1>
        <AddProjectDialog />
      </header>

      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <Link
              key={tab.value}
              href={`/?status=${tab.value.toLowerCase()}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {showEmptyState ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            No projects yet. Add your first project site to get started.
          </p>
          <AddProjectDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              location={project.location}
              status={project.status}
              workerCount={project._count.workers}
              onStatusChange={async (status) => {
                "use server";
                await handleStatusChange(project.id, status);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
