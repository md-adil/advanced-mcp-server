const decoder = new TextDecoder();
export class ExecCommand extends Error {
  constructor(public readonly code: number, message: string) {
    super(message);
  }
}

interface CommandOptions extends Deno.CommandOptions {
  timeout?: number;
}

export async function executeCommand(
  command: string,
  args: string[],
  options: CommandOptions = {}
) {
  const cmd = new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
    signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined!,
    ...options,
  });

  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new ExecCommand(code, decoder.decode(stderr));
  }
  return decoder.decode(stdout);
}
