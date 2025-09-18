// deno-lint-ignore-file no-case-declarations
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Logger } from "../utils/logger.ts";
import { MemoryCache } from "../utils/cache.ts";
import { MetricsCollector } from "../tools/metrics/index.ts";
// Tool imports for summary
import { filesystemTools } from "../tools/filesystem/index.ts";
import { gitTools } from "../tools/git/index.ts";
import { dockerTools } from "../tools/docker/index.ts";
import { websocketTools } from "../tools/websocket/index.ts";
import { benchmarkTools } from "../tools/benchmark/index.ts";
import { elasticTools } from "../tools/elastic/index.ts";
import { cacheTools } from "../tools/cache/index.ts";
import { metricsTools } from "../tools/metrics/index.ts";
import { httpTools } from "../tools/http/index.ts";
import { commandTools } from "../tools/command/index.ts";

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
  server: any,
  logger: Logger,
  cache: MemoryCache,
  metricsCollector: MetricsCollector
) {
  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  // Read resources
  server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
    const { uri } = request.params;

    switch (uri) {
      case "logs://recent":
        return {
          contents: [
            {
              uri,
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
        const toolsSummary = {
          filesystem: {
            count: filesystemTools.length,
            tools: filesystemTools.map((t: { name: string }) => t.name),
          },
          git: {
            count: gitTools.length,
            tools: gitTools.map((t: { name: string }) => t.name),
          },
          docker: {
            count: dockerTools.length,
            tools: dockerTools.map((t: { name: string }) => t.name),
          },
          websocket: {
            count: websocketTools.length,
            tools: websocketTools.map((t: { name: string }) => t.name),
          },
          benchmark: {
            count: benchmarkTools.length,
            tools: benchmarkTools.map((t: { name: string }) => t.name),
          },
          elastic: {
            count: elasticTools.length,
            tools: elasticTools.map((t: { name: string }) => t.name),
          },
          cache: {
            count: cacheTools.length,
            tools: cacheTools.map((t: { name: string }) => t.name),
          },
          metrics: {
            count: metricsTools.length,
            tools: metricsTools.map((t: { name: string }) => t.name),
          },
          http: {
            count: httpTools.length,
            tools: httpTools.map((t: { name: string }) => t.name),
          },
          command: {
            count: commandTools.length,
            tools: commandTools.map((t: { name: string }) => t.name),
          },
        };
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
