import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
// Helper to wrap simple data in default text format
export function wrapAsTextResponse(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}
