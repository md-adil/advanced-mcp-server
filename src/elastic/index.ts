import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import {
  getDashboards,
  getMetrics,
  getLogs,
  getTraces,
  getErrors,
  getServices,
  searchLogs,
  healthCheck,
  executeRawQuery,
} from "./handler.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";

export function elasticModule(server: McpServer) {
  server.registerTool(
    "elastic_get_dashboards",
    {
      inputSchema: {},
    },
    async () => {
      return wrapAsTextResponse(await getDashboards());
    }
  );

  server.registerTool(
    "elastic_get_metrics",
    {
      inputSchema: {
        service_name: z
          .string()
          .optional()
          .describe("Service name to filter metrics"),
        time_range: z
          .string()
          .default("15m")
          .describe("Time range (e.g., '15m', '1h', '1d')"),
        environment: z.string().optional().describe("Environment filter"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getMetrics(args));
    }
  );

  server.registerTool(
    "elastic_get_logs",
    {
      inputSchema: {
        index: z.string().default("logs-*").describe("Log index pattern"),
        service_name: z
          .string()
          .optional()
          .describe("Service name to filter logs"),
        log_level: z
          .enum(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"])
          .optional()
          .describe("Log level filter"),
        time_range: z
          .string()
          .default("15m")
          .describe("Time range (e.g., '15m', '1h', '1d')"),
        size: z
          .number()
          .default(100)
          .describe("Number of log entries to return"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getLogs(args));
    }
  );

  server.registerTool(
    "elastic_get_traces",
    {
      inputSchema: {
        service_name: z
          .string()
          .optional()
          .describe("Service name to filter traces"),
        trace_id: z.string().optional().describe("Specific trace ID"),
        transaction_name: z
          .string()
          .optional()
          .describe("Transaction name filter"),
        time_range: z
          .string()
          .default("15m")
          .describe("Time range (e.g., '15m', '1h', '1d')"),
        size: z.number().default(50).describe("Number of traces to return"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getTraces(args));
    }
  );

  server.registerTool(
    "elastic_get_errors",
    {
      inputSchema: {
        service_name: z
          .string()
          .optional()
          .describe("Service name to filter errors"),
        error_type: z
          .string()
          .optional()
          .describe("Error type or exception class"),
        time_range: z
          .string()
          .default("15m")
          .describe("Time range (e.g., '15m', '1h', '1d')"),
        size: z.number().default(50).describe("Number of errors to return"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getErrors(args));
    }
  );

  server.registerTool(
    "elastic_get_services",
    {
      inputSchema: {
        environment: z.string().optional().describe("Environment filter"),
        time_range: z
          .string()
          .default("15m")
          .describe("Time range (e.g., '15m', '1h', '1d')"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getServices(args));
    }
  );

  server.registerTool(
    "elastic_search_logs",
    {
      inputSchema: {
        index: z.string().default("logs-*").describe("Index pattern to search"),
        query: z.string().describe("Elasticsearch query string"),
        time_range: z
          .string()
          .default("15m")
          .describe("Time range (e.g., '15m', '1h', '1d')"),
        size: z.number().default(100).describe("Number of results to return"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await searchLogs(args));
    }
  );

  server.registerTool(
    "elastic_health_check",
    {
      inputSchema: {},
    },
    async () => {
      return wrapAsTextResponse(await healthCheck());
    }
  );

  server.registerTool(
    "elasticsearch_query",
    {
      description:
        "Execute raw queries against an Elasticsearch server using its REST API. Supports any endpoint such as /_search, /<index>/_doc/<id>, or /_cluster/health.",
      inputSchema: {
        path: z
          .string()
          .describe(
            "Elasticsearch API endpoint path (e.g., '/_search', '/my-index/_doc/1', '/_cluster/health')"
          ),
        method: z
          .string()
          .default("GET")
          .describe("HTTP method (GET, POST, PUT, DELETE, HEAD, OPTIONS)"),
        body: z
          .string()
          .optional()
          .describe(
            "Request body as JSON string (optional, required for search or indexing queries)"
          ),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await executeRawQuery(args));
    }
  );
}
