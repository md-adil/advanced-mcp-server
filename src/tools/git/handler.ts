import { CommandResult, GitStatus } from "../../types.ts";
import { ToolResult } from "../../types/tool-response.ts";

// Utility function to execute commands
async function executeCommand(
  command: string,
  args: string[],
  cwd?: string
): Promise<CommandResult> {
  const cmd = new Deno.Command(command, {
    args,
    cwd: cwd!,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();
  return {
    exitCode: code,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
  };
}

// Individual tool functions
async function status(args: { path?: string }): Promise<ToolResult> {
  const cwd = args.path || ".";

  const statusResult = await executeCommand(
    "git",
    ["status", "--porcelain"],
    cwd
  );
  const branchResult = await executeCommand(
    "git",
    ["branch", "--show-current"],
    cwd
  );
  const aheadBehindResult = await executeCommand(
    "git",
    ["rev-list", "--count", "--left-right", "@{upstream}...HEAD"],
    cwd
  );

  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];

  statusResult.stdout.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const status = line.substring(0, 2);
    const file = line.substring(3);

    if (status[0] !== " " && status[0] !== "?") staged.push(file);
    if (status[1] !== " ") unstaged.push(file);
    if (status === "??") untracked.push(file);
  });

  const [behind, ahead] = aheadBehindResult.stdout
    .trim()
    .split("\t")
    .map(Number);

  return {
    branch: branchResult.stdout.trim(),
    changes: { staged, unstaged, untracked },
    commits: { ahead: ahead || 0, behind: behind || 0 },
  };
}

async function add(args: { files?: string[]; all?: boolean }): Promise<ToolResult> {
  const gitArgs = ["add"];
  if (args.all) {
    gitArgs.push(".");
  } else if (args.files) {
    gitArgs.push(...args.files);
  } else {
    throw new Error("Either 'files' or 'all' must be specified");
  }

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || "Files added successfully",
  };
}

async function commit(args: {
  message: string;
  author?: string;
  amend?: boolean;
}): Promise<ToolResult> {
  const gitArgs = ["commit", "-m", args.message];
  if (args.amend) gitArgs.push("--amend");
  if (args.author) gitArgs.push("--author", args.author);

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || result.stdout || "Commit created successfully",
    hash: result.stdout.match(/\[.* ([a-f0-9]{7})\]/)?.[1],
  };
}

async function push(args: {
  remote?: string;
  branch?: string;
  force?: boolean;
}): Promise<ToolResult> {
  const gitArgs = ["push"];
  if (args.force) gitArgs.push("--force");
  if (args.remote) gitArgs.push(args.remote);
  if (args.branch) gitArgs.push(args.branch);

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || "Push completed successfully",
  };
}

async function pull(args: {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}): Promise<ToolResult> {
  const gitArgs = ["pull"];
  if (args.rebase) gitArgs.push("--rebase");
  if (args.remote) gitArgs.push(args.remote);
  if (args.branch) gitArgs.push(args.branch);

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || result.stdout || "Pull completed successfully",
  };
}

async function branch(args: {
  action?: string;
  name?: string;
  force?: boolean;
}): Promise<ToolResult> {
  let gitArgs: string[] = [];

  switch (args.action) {
    case "list":
      gitArgs = ["branch", "-a"];
      break;
    case "create":
      if (!args.name) throw new Error("Branch name required for create action");
      gitArgs = ["branch", args.name];
      break;
    case "delete":
      if (!args.name) throw new Error("Branch name required for delete action");
      gitArgs = ["branch", args.force ? "-D" : "-d", args.name];
      break;
    case "switch":
      if (!args.name) throw new Error("Branch name required for switch action");
      gitArgs = ["checkout", args.name];
      break;
    default:
      gitArgs = ["branch"];
  }

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    branches: result.stdout
      .split("\n")
      .filter(Boolean)
      .map((b) => b.trim()),
    message: result.stderr || "Branch operation completed",
  };
}

async function log(args: {
  limit?: number;
  oneline?: boolean;
  author?: string;
  since?: string;
}): Promise<ToolResult> {
  const gitArgs = ["log", `--max-count=${args.limit || 10}`];
  if (args.oneline) gitArgs.push("--oneline");
  if (args.author) gitArgs.push(`--author=${args.author}`);
  if (args.since) gitArgs.push(`--since=${args.since}`);

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    log: result.stdout,
    commits: result.stdout.split("\n").filter(Boolean).length,
  };
}

async function diff(args: {
  staged?: boolean;
  file?: string;
  commit?: string;
}): Promise<ToolResult> {
  const gitArgs = ["diff"];
  if (args.staged) gitArgs.push("--staged");
  if (args.commit) gitArgs.push(args.commit);
  if (args.file) gitArgs.push(args.file);

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    diff: result.stdout,
    hasChanges: result.stdout.length > 0,
  };
}

async function stash(args: {
  action?: string;
  message?: string;
  index?: number;
}): Promise<ToolResult> {
  let gitArgs: string[] = ["stash"];

  switch (args.action) {
    case "push":
      if (args.message) gitArgs.push("-m", args.message);
      break;
    case "pop":
      gitArgs.push("pop");
      if (args.index !== undefined) gitArgs.push(`stash@{${args.index}}`);
      break;
    case "list":
      gitArgs.push("list");
      break;
    case "apply":
      gitArgs.push("apply");
      if (args.index !== undefined) gitArgs.push(`stash@{${args.index}}`);
      break;
    case "drop":
      gitArgs.push("drop");
      if (args.index !== undefined) gitArgs.push(`stash@{${args.index}}`);
      break;
  }

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    output: result.stdout,
    message: result.stderr || "Stash operation completed",
  };
}

async function clone(args: {
  url: string;
  destination?: string;
  branch?: string;
  depth?: number;
}): Promise<ToolResult> {
  const gitArgs = ["clone"];
  if (args.branch) gitArgs.push("-b", args.branch);
  if (args.depth) gitArgs.push("--depth", args.depth.toString());
  gitArgs.push(args.url);
  if (args.destination) gitArgs.push(args.destination);

  const result = await executeCommand("git", gitArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || "Repository cloned successfully",
  };
}

// Main execution function - handles all git tool cases
export async function executeGitTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "git_status":
      return await status(args as { path?: string });
    case "git_add":
      return await add(args as { files?: string[]; all?: boolean });
    case "git_commit":
      return await commit(
        args as { message: string; author?: string; amend?: boolean }
      );
    case "git_push":
      return await push(
        args as { remote?: string; branch?: string; force?: boolean }
      );
    case "git_pull":
      return await pull(
        args as { remote?: string; branch?: string; rebase?: boolean }
      );
    case "git_branch":
      return await branch(
        args as { action?: string; name?: string; force?: boolean }
      );
    case "git_log":
      return await log(
        args as {
          limit?: number;
          oneline?: boolean;
          author?: string;
          since?: string;
        }
      );
    case "git_diff":
      return await diff(
        args as { staged?: boolean; file?: string; commit?: string }
      );
    case "git_stash":
      return await stash(
        args as { action?: string; message?: string; index?: number }
      );
    case "git_clone":
      return await clone(
        args as {
          url: string;
          destination?: string;
          branch?: string;
          depth?: number;
        }
      );
    default:
      throw new Error(`Unknown git tool: ${name}`);
  }
}
