import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { cacheSet, cacheGet, cacheDelete, cache } from "./handler.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";

export function cacheModule(server: McpServer) {
  server.registerTool(
    "cache_set",
    {
      inputSchema: {
        key: z.string().describe("Cache key"),
        value: z.string().describe("Cache value"),
        ttl: z.number().default(3600).describe("Time to live in seconds"),
      },
    },
    ({ key, value, ttl }) => {
      return wrapAsTextResponse(cacheSet({ key, value, ttl }));
    }
  );

  server.registerTool(
    "cache_get",
    {
      inputSchema: {
        key: z.string().describe("Cache key"),
      },
    },
    ({ key }) => {
      return wrapAsTextResponse(cacheGet({ key }));
    }
  );

  server.registerTool(
    "cache_delete",
    {
      inputSchema: {
        key: z.string().describe("Cache key"),
      },
    },
    ({ key }) => {
      return wrapAsTextResponse(cacheDelete({ key }));
    }
  );

  server.registerResource("cache-status", "cache://status", {}, ({ href }) => {
    return {
      contents: [
        {
          uri: href,
          mimeType: "application/json",
          text: JSON.stringify(cache.getStats(), null, 2),
        },
      ],
    };
  });
}
