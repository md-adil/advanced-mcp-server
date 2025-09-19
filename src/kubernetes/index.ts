import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { helmExecute, kubectlExecute } from "./handler.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";

export function kubernetesModule(server: McpServer) {
  server.registerTool(
    "kubectl_execute",
    {
      description:
        "Run arbitrary kubectl commands against the Kubernetes cluster",
      inputSchema: {
        timeout: z
          .number()
          .optional()
          .describe("Optional command timeout in seconds"),
        args: z
          .array(z.string())
          .nonempty()
          .describe(
            "Arguments to pass to kubectl (e.g., ['get', 'pods'], ['describe', 'service', 'nginx'])"
          ),
      },
    },
    async ({ args, timeout }) => {
      return wrapAsTextResponse(
        await kubectlExecute({ args, timeout: timeout! })
      );
    }
  );

  server.registerTool(
    "helm_execute",
    {
      description:
        "Run arbitrary Helm CLI commands for managing Helm charts and releases",
      inputSchema: {
        timeout: z
          .number()
          .optional()
          .describe("Optional command timeout in seconds"),
        args: z
          .array(z.string())
          .nonempty()
          .describe(
            "Arguments to pass to helm (e.g., ['list'], ['install', 'mychart', './chart'])"
          ),
      },
    },
    async ({ args, timeout }) => {
      return wrapAsTextResponse(await helmExecute(args, timeout));
    }
  );
}
