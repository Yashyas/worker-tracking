export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function createDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthDateRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month, getDaysInMonth(year, month)));
  return { start, end };
}

export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDayName(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short" });
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7);
}

export function getWeekStartEnd(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month, day));
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(Date.UTC(year, month, day + diffToMonday));
  const sunday = new Date(Date.UTC(year, month, day + diffToMonday + 6));
  return { monday, sunday };
}
