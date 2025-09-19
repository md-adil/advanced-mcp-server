type GitParsed =
  | { type: "status"; data: ReturnType<typeof parseGitStatus> }
  | { type: "log"; data: ReturnType<typeof parseGitLog> }
  | { type: "branch"; data: ReturnType<typeof parseGitBranch> }
  | string;

export function parseGitOutput(command: string, output: string): GitParsed {
  if (command.startsWith("status")) {
    return { type: "status", data: parseGitStatus(output) };
  }
  if (command.startsWith("log")) {
    return { type: "log", data: parseGitLog(output) };
  }
  if (command.startsWith("branch")) {
    return { type: "branch", data: parseGitBranch(output) };
  }

  return output;
}

/* --- Individual parsers --- */

function parseGitStatus(output: string) {
  const result = {
    branch: "",
    tracking: "",
    ahead: 0,
    behind: 0,
    staged: [] as string[],
    modified: [] as string[],
    untracked: [] as string[],
  };

  const lines = output.split("\n").map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith("On branch")) {
      result.branch = line.replace("On branch", "").trim();
    } else if (line.includes("Your branch is up to date with")) {
      result.tracking = line.match(/'([^']+)'/)?.[1] || "";
    } else if (line.includes("ahead of")) {
      result.ahead = parseInt(line.match(/by (\d+)/)?.[1] || "0", 10);
    } else if (line.includes("behind")) {
      result.behind = parseInt(line.match(/by (\d+)/)?.[1] || "0", 10);
    } else if (line.startsWith("modified:")) {
      result.modified.push(line.replace("modified:", "").trim());
    } else if (
      i > 0 &&
      lines[i - 1]!.startsWith("Untracked files:") &&
      line !== "" &&
      !line.startsWith("(")
    ) {
      result.untracked.push(line);
    }
  }
  return result;
}

function parseGitLog(output: string) {
  // Example: git log --oneline
  return output
    .trim()
    .split("\n")
    .map((line) => {
      const [hash, ...message] = line.split(" ");
      return { hash, message: message.join(" ") };
    });
}

function parseGitBranch(output: string) {
  return output
    .trim()
    .split("\n")
    .map((line) => ({
      current: line.startsWith("*"),
      name: line.replace(/^\*?\s*/, ""),
    }));
}
