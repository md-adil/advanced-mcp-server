export function formatToolTextOutput(output: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(output) }],
  } as const;
}
