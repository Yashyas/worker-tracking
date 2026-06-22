"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@prisma/client";

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;

  if (!name?.trim()) {
    throw new Error("Project name is required");
  }

  await prisma.project.create({
    data: {
      name: name.trim(),
      location: location?.trim() || null,
    },
  });

  revalidatePath("/");
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
) {
  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
}

export async function listProjects(status?: ProjectStatus) {
  return prisma.project.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { workers: true } },
    },
  });
}

export async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { workers: true } },
    },
  });
}
