import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { kubectlExecute } from "./handler.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";

export function kubernetesModule(server: McpServer) {
  server.registerTool(
    "kubernetes_kubectl_execute",
    {
      inputSchema: {
        command: z.string().describe("The kubectl subcommand (e.g., 'get pods', 'describe service nginx')"),
        namespace: z.string().optional().describe("Kubernetes namespace (optional, uses current context default if not specified)"),
        output_format: z.enum(["json", "yaml", "wide", "name", "table"]).optional().describe("Output format for the command"),
        timeout: z.number().optional().describe("Command timeout in seconds (default: 30)"),
      },
    },
    async ({ command, namespace, output_format, timeout }) => {
      return wrapAsTextResponse(await kubectlExecute({ command, namespace, output_format, timeout }));
    }
  );
}