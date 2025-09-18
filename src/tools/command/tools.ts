export const commandTools = [
  {
    name: "exec_command",
    description: "Execute shell commands",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Command arguments",
        },
        cwd: { type: "string", description: "Working directory" },
        timeout: {
          type: "number",
          description: "Timeout in ms",
          default: 30000,
        },
      },
      required: ["command"],
    },
  },
];