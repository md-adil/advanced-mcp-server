import { logger } from "../logger/index.ts";
import { executeCommand } from "../utils/command.ts";
import { createAzureConfig } from "./config.ts";

export async function azure(
  command: string,
  args: string[] = [],
  options: {
    format?: "json" | "table" | "tsv";
    output?: boolean;
    organization?: boolean;
  } = {}
) {
  const config = createAzureConfig();
  const formatArg = options.format === "json" ? ["--output", "json"] : [];
  const orgArgs: string[] = [];
  // Add organization and project parameters if not already present
  if (!args.includes("--organization") && options.organization !== false) {
    orgArgs.push("--organization", config.organization);
  }

  const projectArgs =
    config.project && !args.includes("--project") && !args.includes("-p")
      ? ["--project", config.project]
      : [];

  const fullCommand = [
    "az",
    command,
    ...args,
    ...orgArgs,
    ...projectArgs,
    ...formatArg,
  ];

  logger.debug("az cli", { args: fullCommand });

  const stdout = await executeCommand(fullCommand[0]!, fullCommand.slice(1));

  let data: unknown = stdout;
  if (options.format === "json" && stdout) {
    try {
      data = JSON.parse(stdout);
    } catch {
      // If JSON parsing fails, return raw stdout
    }
  }
  return data;
}
