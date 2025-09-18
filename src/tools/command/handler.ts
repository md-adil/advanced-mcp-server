async function execCommand(args: {
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number;
}) {
  const commandOptions: any = {
    args: args.args || [],
    stdout: "piped",
    stderr: "piped",
  };

  if (args.cwd) {
    commandOptions.cwd = args.cwd;
  }

  const command = new Deno.Command(args.command, commandOptions);

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    args.timeout || 30000
  );

  try {
    const { code, stdout, stderr } = await command.output();
    clearTimeout(timeoutId);

    return {
      exitCode: code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Functional interface for tool execution
export function executeCommandTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "exec_command":
      return execCommand(args as {
        command: string;
        args?: string[];
        cwd?: string;
        timeout?: number;
      });
    default:
      throw new Error(`Unknown command tool: ${name}`);
  }
}