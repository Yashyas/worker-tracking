export function parseTimeToDecimal(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}

export function formatHours(hours: number): string {
  return hours.toFixed(2);
}

export function calculateHoursBetween(fromTime: string, toTime: string): number {
  const from = parseTimeToDecimal(fromTime);
  const to = parseTimeToDecimal(toTime);
  if (to <= from) return 0;
  return Math.round((to - from) * 100) / 100;
}

export function splitShiftIfOvernight(
  date: Date,
  fromTime: string,
  toTime: string
): Array<{ date: Date; fromTime: string; toTime: string; hoursWorked: number }> {
  if (toTime > fromTime) {
    return [
      {
        date: new Date(date),
        fromTime,
        toTime,
        hoursWorked: calculateHoursBetween(fromTime, toTime),
      },
    ];
  }

  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const blockAFrom = fromTime;
  const blockATo = "23:59";
  const blockBFrom = "00:00";
  const blockBTo = toTime;

  return [
    {
      date: new Date(date),
      fromTime: blockAFrom,
      toTime: blockATo,
      hoursWorked: calculateHoursBetween(blockAFrom, blockATo),
    },
    {
      date: new Date(nextDate),
      fromTime: blockBFrom,
      toTime: blockBTo,
      hoursWorked: calculateHoursBetween(blockBFrom, blockBTo),
    },
  ];
}
