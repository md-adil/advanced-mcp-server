import { CommandResult, GitStatus } from "../../types.ts";

export class GitHandler {
  private async executeCommand(
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

  async status(args: { path?: string }): Promise<GitStatus> {
    const cwd = args.path || ".";

    const statusResult = await this.executeCommand(
      "git",
      ["status", "--porcelain"],
      cwd
    );
    const branchResult = await this.executeCommand(
      "git",
      ["branch", "--show-current"],
      cwd
    );
    const aheadBehindResult = await this.executeCommand(
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

  async add(args: { files?: string[]; all?: boolean }) {
    const gitArgs = ["add"];
    if (args.all) {
      gitArgs.push(".");
    } else if (args.files) {
      gitArgs.push(...args.files);
    } else {
      throw new Error("Either 'files' or 'all' must be specified");
    }

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || "Files added successfully",
    };
  }

  async commit(args: { message: string; author?: string; amend?: boolean }) {
    const gitArgs = ["commit", "-m", args.message];
    if (args.amend) gitArgs.push("--amend");
    if (args.author) gitArgs.push("--author", args.author);

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || result.stdout || "Commit created successfully",
      hash: result.stdout.match(/\[.* ([a-f0-9]{7})\]/)?.[1],
    };
  }

  async push(args: { remote?: string; branch?: string; force?: boolean }) {
    const gitArgs = ["push"];
    if (args.force) gitArgs.push("--force");
    if (args.remote) gitArgs.push(args.remote);
    if (args.branch) gitArgs.push(args.branch);

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || "Push completed successfully",
    };
  }

  async pull(args: { remote?: string; branch?: string; rebase?: boolean }) {
    const gitArgs = ["pull"];
    if (args.rebase) gitArgs.push("--rebase");
    if (args.remote) gitArgs.push(args.remote);
    if (args.branch) gitArgs.push(args.branch);

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || result.stdout || "Pull completed successfully",
    };
  }

  async branch(args: { action?: string; name?: string; force?: boolean }) {
    let gitArgs: string[] = [];

    switch (args.action) {
      case "list":
        gitArgs = ["branch", "-a"];
        break;
      case "create":
        if (!args.name)
          throw new Error("Branch name required for create action");
        gitArgs = ["branch", args.name];
        break;
      case "delete":
        if (!args.name)
          throw new Error("Branch name required for delete action");
        gitArgs = ["branch", args.force ? "-D" : "-d", args.name];
        break;
      case "switch":
        if (!args.name)
          throw new Error("Branch name required for switch action");
        gitArgs = ["checkout", args.name];
        break;
      default:
        gitArgs = ["branch"];
    }

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      branches: result.stdout
        .split("\n")
        .filter(Boolean)
        .map((b) => b.trim()),
      message: result.stderr || "Branch operation completed",
    };
  }

  async log(args: {
    limit?: number;
    oneline?: boolean;
    author?: string;
    since?: string;
  }) {
    const gitArgs = ["log", `--max-count=${args.limit || 10}`];
    if (args.oneline) gitArgs.push("--oneline");
    if (args.author) gitArgs.push(`--author=${args.author}`);
    if (args.since) gitArgs.push(`--since=${args.since}`);

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      log: result.stdout,
      commits: result.stdout.split("\n").filter(Boolean).length,
    };
  }

  async diff(args: { staged?: boolean; file?: string; commit?: string }) {
    const gitArgs = ["diff"];
    if (args.staged) gitArgs.push("--staged");
    if (args.commit) gitArgs.push(args.commit);
    if (args.file) gitArgs.push(args.file);

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      diff: result.stdout,
      hasChanges: result.stdout.length > 0,
    };
  }

  async stash(args: { action?: string; message?: string; index?: number }) {
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

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      message: result.stderr || "Stash operation completed",
    };
  }

  async clone(args: {
    url: string;
    destination?: string;
    branch?: string;
    depth?: number;
  }) {
    const gitArgs = ["clone"];
    if (args.branch) gitArgs.push("-b", args.branch);
    if (args.depth) gitArgs.push("--depth", args.depth.toString());
    gitArgs.push(args.url);
    if (args.destination) gitArgs.push(args.destination);

    const result = await this.executeCommand("git", gitArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || "Repository cloned successfully",
    };
  }
}
