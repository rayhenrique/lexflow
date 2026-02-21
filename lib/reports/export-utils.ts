function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function exportJsonToCsv(
  rows: Array<Record<string, string | number | null | undefined>>,
  filename: string,
) {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((header) => escapeCsvCell(header)).join(";"),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const rawValue = row[header];
          const text = rawValue === null || rawValue === undefined ? "" : String(rawValue);
          return escapeCsvCell(text);
        })
        .join(";"),
    ),
  ];

  const csvContent = `\uFEFF${lines.join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
