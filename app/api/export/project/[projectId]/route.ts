import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCSV, getContentType, getContentDisposition } from "@/lib/csv";
import { calculateTotalHours, calculateDayWage } from "@/lib/wages";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from + "T00:00:00Z");
  if (to) dateFilter.lte = new Date(to + "T00:00:00Z");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workers: {
        include: {
          attendances: {
            where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
            include: { timeBlocks: true },
            orderBy: { date: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project) {
    return new NextResponse("Project not found", { status: 404 });
  }

  const headers = ["Worker Name", "Worker Type", "Date", "Status", "Total Hours", "Day Wage"];
  const rows: string[][] = [];

  for (const worker of project.workers) {
    for (const attendance of worker.attendances) {
      const totalHours = attendance.timeBlocks.reduce((sum, tb) => sum + Number(tb.hoursWorked), 0);
      const dayWage = calculateDayWage(totalHours, Number(worker.hourlyWage));

      rows.push([
        worker.name,
        worker.workerType,
        format(new Date(attendance.date), "yyyy-MM-dd"),
        attendance.status === "PRESENT" ? "Present" : "Absent",
        totalHours.toFixed(2),
        dayWage.toFixed(2),
      ]);
    }
  }

  const csv = generateCSV(headers, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": getContentType(),
      "Content-Disposition": getContentDisposition(
        `${project.name.replace(/\s+/g, "_")}_export.csv`
      ),
    },
  });
}
