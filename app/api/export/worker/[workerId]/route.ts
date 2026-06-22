import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCSV, getContentType, getContentDisposition } from "@/lib/csv";
import { calculateTotalHours, calculateDayWage } from "@/lib/wages";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const { workerId } = await params;
  const url = new URL(request.url);
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      project: true,
      attendances: {
        where: {
          date: {
            gte: new Date(Date.UTC(year, month - 1, 1)),
            lte: new Date(Date.UTC(year, month, 0)),
          },
        },
        include: { timeBlocks: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!worker) {
    return new NextResponse("Worker not found", { status: 404 });
  }

  const headers = ["Date", "Day", "Status", "Time Blocks", "Total Hours", "Hourly Wage", "Day Wage"];
  const rows: string[][] = [];
  let monthlyTotalHours = 0;
  let monthlyTotalWage = 0;

  for (const attendance of worker.attendances) {
    const dateStr = format(new Date(attendance.date), "yyyy-MM-dd");
    const day = format(new Date(attendance.date), "EEE");
    const timeBlocksStr = attendance.timeBlocks
      .map((tb) => `${tb.fromTime}–${tb.toTime}`)
      .join(", ");
    const totalHours = attendance.timeBlocks.reduce((sum, tb) => sum + Number(tb.hoursWorked), 0);
    const dayWage = calculateDayWage(totalHours, Number(worker.hourlyWage));

    monthlyTotalHours += totalHours;
    monthlyTotalWage += dayWage;

    rows.push([
      dateStr,
      day,
      attendance.status === "PRESENT" ? "Present" : "Absent",
      timeBlocksStr || "—",
      totalHours.toFixed(2),
      `${Number(worker.hourlyWage).toFixed(2)}`,
      dayWage.toFixed(2),
    ]);
  }

  rows.push(["", "", "", "", "", "", ""]);
  rows.push(["Monthly Total", "", "", "", monthlyTotalHours.toFixed(2), "", monthlyTotalWage.toFixed(2)]);

  const csv = generateCSV(headers, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": getContentType(),
      "Content-Disposition": getContentDisposition(
        `${worker.name.replace(/\s+/g, "_")}_${year}-${String(month).padStart(2, "0")}.csv`
      ),
    },
  });
}
