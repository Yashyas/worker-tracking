"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createWorker(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const workerType = formData.get("workerType") as string;
  const hourlyWage = formData.get("hourlyWage") as string;

  if (!name?.trim()) throw new Error("Worker name is required");
  if (!hourlyWage || isNaN(Number(hourlyWage))) throw new Error("Valid hourly wage is required");

  await prisma.worker.create({
    data: {
      projectId,
      name: name.trim(),
      workerType: workerType?.trim() || "",
      hourlyWage: Number(hourlyWage),
    },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function listWorkersByProject(projectId: string, date?: Date) {
  return prisma.worker.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
    include: {
      attendances: {
        where: date
          ? { date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) }
          : undefined,
        include: { timeBlocks: true },
      },
    },
  });
}

export async function getWorker(workerId: string) {
  return prisma.worker.findUnique({
    where: { id: workerId },
    include: { project: true },
  });
}

export async function getWorkerMonthlyData(
  workerId: string,
  year: number,
  month: number
) {
  const startDate = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endDate = new Date(Date.UTC(year, month, daysInMonth));

  const attendances = await prisma.attendance.findMany({
    where: {
      workerId,
      date: { gte: startDate, lte: endDate },
    },
    include: { timeBlocks: true },
    orderBy: { date: "asc" },
  });

  const attendanceMap = new Map(
    attendances.map((a) => [a.date.toISOString().split("T")[0], a])
  );

  return { attendances, attendanceMap, daysInMonth };
}

export async function getWorkerAvailableMonths(workerId: string) {
  const attendances = await prisma.attendance.findMany({
    where: { workerId },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const seen = new Set<string>();
  const months: Array<{ year: number; month: number }> = [];

  for (const a of attendances) {
    const key = `${a.date.getUTCFullYear()}-${a.date.getUTCMonth()}`;
    if (!seen.has(key)) {
      seen.add(key);
      months.push({
        year: a.date.getUTCFullYear(),
        month: a.date.getUTCMonth(),
      });
    }
  }

  return months;
}
