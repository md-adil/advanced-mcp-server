import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Logger } from "./logger.ts";

export const logger = new Logger();

export function loggerModule(server: McpServer) {
  server.registerResource(
    "recent-logs",
    "logs://recent",
    {
      name: "Recent Logs",
      description: "Recent server log entries",
      mimeType: "application/json",
    },
    ({ href }) => {
      return {
        contents: [
          {
            uri: href,
            mimeType: "application/json",
            text: JSON.stringify(logger.getRecentLogs(50), null, 2),
          },
        ],
      };
    }
  );
}
