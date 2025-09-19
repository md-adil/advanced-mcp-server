import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { wrapAsTextResponse } from "../utils/tools.ts";
import { httpRequest } from "./handler.ts";

export function httpModule(app: McpServer) {
  app.registerTool(
    "http_request",
    {
      inputSchema: {
        url: z.string().describe("URL to request"),
        method: z.string().default("GET").describe("Request Method"),
        headers: z.record(z.string()).default({}).describe("Request headers"),
        body: z.string().optional().describe("Request body"),
        timeout: z.number().default(10000).describe("Timeout in ms"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await httpRequest(args));
    }
  );
}
