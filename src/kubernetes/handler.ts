// Utility function to execute kubectl commands
async function executeKubectl(
  args: string[],
  timeout: number = 30000
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  const command = new Deno.Command("kubectl", {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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

export async function kubectlExecute(args: {
  command: string;
  namespace?: string;
  output_format?: string;
  timeout?: number;
}) {
  const kubectlArgs: string[] = [];

  // Parse the command string into arguments
  const commandParts = args.command.trim().split(/\s+/);
  kubectlArgs.push(...commandParts);

  // Add namespace if provided
  if (args.namespace) {
    kubectlArgs.push("-n", args.namespace);
  }

  // Add output format if provided
  if (args.output_format && args.output_format !== "table") {
    kubectlArgs.push("-o", args.output_format);
  }

  const timeout = (args.timeout || 30) * 1000;

  try {
    const result = await executeKubectl(kubectlArgs, timeout);

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      command: `kubectl ${kubectlArgs.join(" ")}`,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
      command: `kubectl ${kubectlArgs.join(" ")}`,
      stdout: "",
      stderr: (error as Error).message,
    };
  }
}
