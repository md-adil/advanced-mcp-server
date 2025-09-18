// deno-lint-ignore-file no-case-declarations
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Logger } from "../utils/logger.ts";
import { MetricsCollector } from "../tools/metrics/index.ts";
import { getToolsSummary } from "../tools/registry.ts";
import { cache } from "../tools/cache/handler.ts";
import { Server } from "@modelcontextprotocol/sdk/server";

// Resource definitions
export const resources = [
  {
    uri: "logs://recent",
    mimeType: "application/json",
    name: "Recent Logs",
    description: "Recent server log entries",
  },
  {
    uri: "metrics://system",
    mimeType: "application/json",
    name: "System Metrics",
    description: "System performance metrics",
  },
  {
    uri: "cache://status",
    mimeType: "application/json",
    name: "Cache Status",
    description: "Current cache status and statistics",
  },
  {
    uri: "config://server",
    mimeType: "application/json",
    name: "Server Configuration",
    description: "Current server configuration",
  },
  {
    uri: "tools://summary",
    mimeType: "application/json",
    name: "Tools Summary",
    description: "Summary of available tools by category",
  },
];

// Resource handlers
export function setupResourceHandlers(
  server: Server,
  logger: Logger,
  metricsCollector: MetricsCollector
) {
  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, () => {
    return { resources };
  });

  // Read resources
  server.setRequestHandler(ReadResourceRequestSchema, (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "logs://recent":
        return {
          contents: [
            {
              uri,
              type: "text",
              mimeType: "application/json",
              text: JSON.stringify(logger.getRecentLogs(50), null, 2),
            },
          ],
        };

      case "metrics://system":
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                metricsCollector.getMetricsHistory(10),
                null,
                2
              ),
            },
          ],
        };

      case "cache://status":
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(cache.getStats(), null, 2),
            },
          ],
        };

      case "config://server":
        const config = {
          name: "advanced-mcp-server",
          version: "3.0.0",
          uptime: Date.now() - (globalThis as any).startTime,
          deno_version: Deno.version,
          capabilities: ["tools", "resources", "prompts", "logging"],
          toolCategories: [
            "filesystem",
            "git",
            "docker",
            "crypto",
            "websocket",
            "code-analysis",
            "benchmark",
            "elastic",
            "cache",
            "utilities",
          ],
        };
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(config, null, 2),
            },
          ],
        };

      case "tools://summary":
        const toolsSummary = getToolsSummary();
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(toolsSummary, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });
}
