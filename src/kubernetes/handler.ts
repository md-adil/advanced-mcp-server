import { executeCommand } from "../utils/command.ts";

export function kubectlExecute(args: { args: string[]; timeout?: number }) {
  return executeCommand("kubectl", args.args, { timeout: args.timeout! });
}

export function helmExecute(args: string[], timeout?: number) {
  return executeCommand("helm", args, { timeout: timeout! });
}
