export const kubernetesTools = [
  {
    name: "kubernetes_kubectl_execute",
    description: "Execute raw kubectl command with arguments",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description:
            "The kubectl subcommand (e.g., 'get pods', 'describe service nginx')",
        },
        namespace: {
          type: "string",
          description:
            "Kubernetes namespace (optional, uses current context default if not specified)",
        },
        output_format: {
          type: "string",
          description: "Output format for the command",
          enum: ["json", "yaml", "wide", "name", "table"],
        },
        timeout: {
          type: "number",
          description: "Command timeout in seconds (default: 30)",
        },
      },
      required: ["command"],
    },
  },
];
