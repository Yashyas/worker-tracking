"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateTotalHours, calculateDayWage } from "@/lib/wages";
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface TimeBlock {
  id: string;
  fromTime: string;
  toTime: string;
  hoursWorked: number;
}

interface AttendanceRow {
  date: Date;
  dateStr: string;
  status: string | null;
  timeBlocks: TimeBlock[];
}

interface MonthlyAttendanceTableProps {
  year: number;
  month: number;
  attendances: Map<string, { status: string; timeBlocks: TimeBlock[] }>;
  hourlyWage: number;
}

export function MonthlyAttendanceTable({ year, month, attendances, hourlyWage }: MonthlyAttendanceTableProps) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });

  const weeks: Array<{ days: Date[]; weekNumber: number }> = [];
  let currentWeek: Date[] = [];

  days.forEach((day) => {
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 1 && currentWeek.length > 0) {
      weeks.push({ days: currentWeek, weekNumber: weeks.length + 1 });
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push({ days: currentWeek, weekNumber: weeks.length + 1 });
  }

  let monthlyTotalHours = 0;
  let monthlyTotalWage = 0;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time Blocks</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead className="text-right">Wage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeks.map((week) => {
            let weekTotalHours = 0;
            let weekTotalWage = 0;

            const rows = week.days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const attendance = attendances.get(dateStr);
              const status = attendance?.status || null;
              const timeBlocks = attendance?.timeBlocks || [];
              const totalHours = calculateTotalHours(timeBlocks);
              const wage = calculateDayWage(totalHours, Number(hourlyWage));

              weekTotalHours += totalHours;
              weekTotalWage += wage;

              return { date: day, dateStr, status, timeBlocks, totalHours, wage };
            });

            monthlyTotalHours += weekTotalHours;
            monthlyTotalWage += weekTotalWage;

            return (
              <>
                {rows.map((row) => (
                  <TableRow
                    key={row.dateStr}
                    className={!row.status || row.status === "ABSENT" ? "text-muted-foreground" : ""}
                  >
                    <TableCell>{format(row.date, "d")}</TableCell>
                    <TableCell>{format(row.date, "EEE")}</TableCell>
                    <TableCell>
                      {row.status === "PRESENT" && (
                        <Badge className="bg-emerald-500 text-white">Present</Badge>
                      )}
                      {row.status === "ABSENT" && (
                        <Badge variant="secondary">Absent</Badge>
                      )}
                      {!row.status && (
                        <Badge variant="outline" className="text-muted-foreground">—</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.timeBlocks.length > 0
                        ? row.timeBlocks.map((tb) => `${tb.fromTime}–${tb.toTime}`).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.totalHours > 0 ? row.totalHours.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.wage > 0 ? formatCurrency(row.wage) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={4} className="text-sm">
                    Week {week.weekNumber} total
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {weekTotalHours.toFixed(1)} hrs
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(weekTotalWage)}
                  </TableCell>
                </TableRow>
              </>
            );
          })}
          <TableRow className="bg-primary/5 font-bold">
            <TableCell colSpan={4} className="text-sm">Monthly Total</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {monthlyTotalHours.toFixed(1)} hrs
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatCurrency(monthlyTotalWage)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
