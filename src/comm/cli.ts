import { azure } from "../azure/cli.ts";
import { logger } from "../logger/index.ts";
import { HOUR, memorize } from "../utils/cache.ts";
import { executeCommand } from "../utils/command.ts";
import { TokenInfo } from "./types.ts";

export async function azureGraph(
  command: string,
  args: string[] = [],
  options: {
    format?: "json" | "table" | "tsv";
    output?: boolean;
  } = {}
) {
  const formatArg = options.format === "json" ? ["--output", "json"] : [];

  const fullCommand = ["az", "rest", command, ...args, ...formatArg];

  logger.debug("az graph api", { args: fullCommand });

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

export const getAccessToken = memorize(async function getAccessToken() {
  const result = await azure<TokenInfo>(
    "account",
    ["get-access-token", "--resource-type", "ms-graph", "--scope", "Mail.Send"],
    { organization: false }
  );
  return result;
}, HOUR * 4);
