"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { splitShiftIfOvernight, calculateHoursBetween } from "@/lib/hours";
import type { AttendanceStatus } from "@/lib/generated/prisma/enums";

export async function markAttendance(
  workerId: string,
  dateStr: string,
  status: AttendanceStatus,
  deleteExistingTimeBlocks: boolean = false
) {
  const date = new Date(dateStr + "T00:00:00Z");

  if (status === "ABSENT" && !deleteExistingTimeBlocks) {
    const existing = await prisma.attendance.findUnique({
      where: { workerId_date: { workerId, date } },
      include: { _count: { select: { timeBlocks: true } } },
    });

    if (existing && existing._count.timeBlocks > 0) {
      return { needsConfirmation: true, blockCount: existing._count.timeBlocks };
    }
  }

  if (status === "ABSENT") {
    await prisma.attendance.upsert({
      where: { workerId_date: { workerId, date } },
      create: { workerId, date, status },
      update: {
        status,
        timeBlocks: deleteExistingTimeBlocks
          ? { deleteMany: {} }
          : undefined,
      },
    });
  } else {
    await prisma.attendance.upsert({
      where: { workerId_date: { workerId, date } },
      create: { workerId, date, status },
      update: { status },
    });
  }

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { projectId: true },
  });

  if (worker) {
    revalidatePath(`/projects/${worker.projectId}`);
    revalidatePath(`/projects/${worker.projectId}/workers/${workerId}`);
  }
}

export async function confirmMarkAbsent(workerId: string, dateStr: string) {
  const date = new Date(dateStr + "T00:00:00Z");

  await prisma.attendance.upsert({
    where: { workerId_date: { workerId, date } },
    create: { workerId, date, status: "ABSENT" },
    update: {
      status: "ABSENT",
      timeBlocks: { deleteMany: {} },
    },
  });

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { projectId: true },
  });

  if (worker) {
    revalidatePath(`/projects/${worker.projectId}`);
    revalidatePath(`/projects/${worker.projectId}/workers/${workerId}`);
  }
}

export async function addTimeBlock(
  workerId: string,
  dateStr: string,
  fromTime: string,
  toTime: string
) {
  const date = new Date(dateStr + "T00:00:00Z");

  let attendance = await prisma.attendance.findUnique({
    where: { workerId_date: { workerId, date } },
  });

  if (!attendance) {
    attendance = await prisma.attendance.create({
      data: { workerId, date, status: "PRESENT" },
    });
  } else if (attendance.status === "ABSENT") {
    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { status: "PRESENT" },
    });
  }

  const blocks = splitShiftIfOvernight(date, fromTime, toTime);

  for (const block of blocks) {
    let blockDate = block.date;
    if (block.date.toISOString().split("T")[0] !== dateStr) {
      let nextDayAttendance = await prisma.attendance.findUnique({
        where: { workerId_date: { workerId, date: blockDate } },
      });

      if (!nextDayAttendance) {
        nextDayAttendance = await prisma.attendance.create({
          data: { workerId, date: blockDate, status: "PRESENT" },
        });
      }

      await prisma.timeBlock.create({
        data: {
          attendanceId: nextDayAttendance.id,
          fromTime: block.fromTime,
          toTime: block.toTime,
          hoursWorked: block.hoursWorked,
        },
      });
    } else {
      await prisma.timeBlock.create({
        data: {
          attendanceId: attendance.id,
          fromTime: block.fromTime,
          toTime: block.toTime,
          hoursWorked: block.hoursWorked,
        },
      });
    }
  }

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { projectId: true },
  });

  if (worker) {
    revalidatePath(`/projects/${worker.projectId}`);
    revalidatePath(`/projects/${worker.projectId}/workers/${workerId}`);
  }
}

export async function deleteTimeBlock(timeBlockId: string) {
  const block = await prisma.timeBlock.findUnique({
    where: { id: timeBlockId },
    include: {
      attendance: {
        include: { worker: { select: { projectId: true } } },
      },
    },
  });

  if (!block) return;

  const { projectId } = block.attendance.worker;

  await prisma.timeBlock.delete({ where: { id: timeBlockId } });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/workers/${block.attendance.workerId}`);
}
