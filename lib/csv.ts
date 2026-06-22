export function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(
  headers: string[],
  rows: string[][]
): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\n") + "\n";
}

export function getContentType(): string {
  return "text/csv; charset=utf-8";
}

export function getContentDisposition(filename: string): string {
  return `attachment; filename="${filename}"`;
}
