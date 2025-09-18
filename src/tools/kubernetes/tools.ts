export const kubernetesTools = [
  {
    name: "kubernetes_get_commands",
    description: "Get all available kubectl commands with descriptions",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter commands by category (optional)",
          enum: ["get", "create", "apply", "delete", "describe", "logs", "exec", "port-forward", "config"]
        }
      },
      required: []
    }
  },
  {
    name: "kubernetes_list_namespaces",
    description: "List all Kubernetes namespaces in the current cluster",
    inputSchema: {
      type: "object",
      properties: {
        show_labels: {
          type: "boolean",
          description: "Show namespace labels"
        },
        output_format: {
          type: "string",
          description: "Output format (json, yaml, wide, name)",
          enum: ["json", "yaml", "wide", "name", "table"]
        }
      },
      required: []
    }
  },
  {
    name: "kubernetes_kubectl_execute",
    description: "Execute raw kubectl command with arguments",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The kubectl subcommand (e.g., 'get pods', 'describe service nginx')"
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace (optional, uses current context default if not specified)"
        },
        output_format: {
          type: "string",
          description: "Output format for the command",
          enum: ["json", "yaml", "wide", "name", "table"]
        },
        timeout: {
          type: "number",
          description: "Command timeout in seconds (default: 30)"
        }
      },
      required: ["command"]
    }
  }
];