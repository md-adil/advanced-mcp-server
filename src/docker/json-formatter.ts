export function tableToJson(output: string) {
  const lines = output.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  // Split headers (normalize to snake_case)
  const headers = lines[0]!
    .split(/ {2,}/)
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  // Split rows
  return lines.slice(1).map((line) => {
    const cols = line.split(/ {2,}/).map((c) => c.trim());

    const row: Record<string, string | string[]> = {};
    headers.forEach((header, i) => {
      // Special case: if a cell contains commas, split into array
      if (cols[i] && cols[i].includes(",")) {
        row[header] = cols[i].split(",").map((v) => v.trim());
      } else {
        row[header] = cols[i] || "";
      }
    });
    return row;
  });
}
