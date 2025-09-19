import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeCommand } from "../utils/command.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";
import { tableToJson } from "./json-formatter.ts";

export function dockerModule(server: McpServer) {
  server.registerTool(
    "docker",
    {
      description:
        "Run any Docker CLI command by passing arguments. \n" +
        "This tool acts as a generic wrapper around the `docker` command, \n" +
        "allowing container, image, volume, network, and system operations. \n" +
        "Usage: provide the same arguments you would to the `docker` CLI.",
      inputSchema: {
        args: z
          .array(z.string())
          .describe(
            "Command line arguments for the `docker` CLI (e.g., ['ps', '-a'])"
          ),
      },
    },
    async ({ args }) => {
      return wrapAsTextResponse(
        tableToJson(await executeCommand("docker", args))
      );
    }
  );
}
