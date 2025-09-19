import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { executeOsascript, executeCommand, takeScreenshot } from "./handler.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";

export function osModule(server: McpServer) {
  server.registerTool(
    "os_osascript",
    {
      inputSchema: {
        script: z
          .string()
          .describe("AppleScript or JavaScript code to execute"),
        language: z
          .enum(["applescript", "javascript"])
          .default("applescript")
          .describe("Script language to use"),
      },
    },
    async ({ script, language }) => {
      return wrapAsTextResponse(await executeOsascript({ script, language }));
    }
  );

  server.registerTool(
    "os_command",
    {
      inputSchema: {
        command: z.string().describe("Shell command to execute"),
        args: z.array(z.string()).optional().describe("Command arguments"),
        timeout: z.number().default(30000).describe("Timeout in milliseconds"),
      },
    },
    async ({ command, args = [], timeout }) => {
      return wrapAsTextResponse(
        await executeCommand({ command, args, timeout })
      );
    }
  );

  server.registerTool(
    "os_screenshot",
    {
      inputSchema: {
        region: z
          .enum(["selection", "window", "fullscreen"])
          .default("selection")
          .describe(
            "Screenshot region: 'selection' opens crosshair to select area, 'window' to click on window, 'fullscreen' captures entire screen"
          ),
        format: z.enum(["png", "jpg"]).default("png").describe("Output format"),
        delay: z
          .number()
          .default(0)
          .describe("Delay before screenshot in seconds"),
      },
    },
    async ({ region, format, delay }) => {
      return await takeScreenshot({ region, format, delay });
    }
  );
}
