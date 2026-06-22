export function calculateDayWage(
  totalHours: number,
  hourlyWage: number
): number {
  return Math.round(totalHours * hourlyWage * 100) / 100;
}

export function calculateTotalWage(
  days: Array<{ totalHours: number; hourlyWage: number }>
): number {
  return days.reduce(
    (sum, d) => sum + calculateDayWage(d.totalHours, d.hourlyWage),
    0
  );
}

export function calculateTotalHours(
  timeBlocks: Array<{ hoursWorked: number }>
): number {
  return timeBlocks.reduce((sum, b) => sum + Number(b.hoursWorked), 0);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
