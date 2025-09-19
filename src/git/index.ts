import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeCommand } from "../utils/command.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";
import { parseGitOutput } from "./json-formatter.ts";

export function gitModule(server: McpServer) {
  server.registerTool(
    "git",
    {
      description:
        "Run any Git CLI command by passing arguments. \n" +
        "This tool acts as a generic wrapper around the `git` command, \n" +
        "allowing status, diff operations. \n" +
        "Usage: provide the same arguments you would to the `git` CLI.",
      inputSchema: {
        cwd: z.string(),
        args: z
          .array(z.string())
          .describe(
            "Command line arguments for the `git` CLI (e.g., ['status'])"
          ),
      },
    },
    async ({ args, cwd }) => {
      return wrapAsTextResponse(
        parseGitOutput(args[0]!, await executeCommand("git", args, { cwd }))
      );
    }
  );
}
