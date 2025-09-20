import { logger } from "../logger/index.ts";
import { memorize } from "../utils/cache.ts";
import { executeCommand } from "../utils/command.ts";
import { createAzureConfig } from "./config.ts";
import { LoggedInUser } from "./types.ts";

export async function azure<T = unknown>(
  command: string,
  args: string[] = [],
  options: {
    format?: "json" | "table" | "tsv";
    output?: boolean;
    organization?: boolean;
  } = {}
) {
  options.format ??= "json";
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
  return data as T;
}

export const getCurrentUser = memorize(async function getCurrentUser() {
  const result = await azure<LoggedInUser>("account", ["show"], {
    format: "json",
    organization: false,
  });
  return { id: result.id, email: result.user.name, type: result.user.type };
}, 60 * 60 * 12);
