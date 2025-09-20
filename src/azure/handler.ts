import { HOUR, memorize } from "../utils/cache.ts";
import { azure, getCurrentUser } from "./cli.ts";
import { Project, User } from "./types.ts";

type Result = Record<string, unknown>;

export const getProjects = memorize(async function getProjects() {
  const result = await azure<{ value: Project[] }>(
    "devops",
    ["project", "list"],
    { format: "json" }
  );
  return result.value.map((x) => ({
    id: x.id,
    name: x.name,
  }));
}, HOUR * 48);

export const getRepositories = memorize(async function getRepositories(args: {
  project: string;
}): Promise<Result> {
  const azArgs = ["list"];
  if (args.project) {
    azArgs.push("--project", args.project);
  }
  const result = await azure("repos", azArgs, { format: "json" });
  return {
    repositories: result,
    project: args.project,
    timestamp: new Date().toISOString(),
  };
},
HOUR * 10);

export const getUsers = memorize(async function getUsers() {
  const azArgs = ["user", "list"];
  azArgs.push("--query", "items[].user", "--top", "1000");
  const result = await azure<User[]>("devops", azArgs, { format: "json" });
  return result.map((user) => ({
    displayName: user.displayName,
    email: user.mailAddress,
    directoryAlias: user.directoryAlias,
  }));
}, 60 * 60 * 12);

export async function getUserProfile(args: {
  email: string;
  project?: string | undefined;
}) {
  const azArgs = ["user", "show", "--user", args.email];
  if (args.project) {
    azArgs.push("--project", args.project);
  }

  const result = await azure("devops", azArgs, { format: "json" });

  return {
    user: result,
    email: args.email,
    project: args.project,
    timestamp: new Date().toISOString(),
  };
}

export const getWorkItems = memorize(async function getWorkItems(args: {
  project?: string | undefined;
  type?: string | undefined;
  state?: string | undefined;
  assigned_to?: string | undefined;
}): Promise<Result> {
  const assignedTo = args.assigned_to ?? (await getCurrentUser()).email;
  // Build WIQL query based on filters
  let wiql =
    "SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType], [System.CreatedDate] FROM WorkItems";
  const conditions = [];

  // Always exclude closed items
  conditions.push(`[System.State] <> 'Closed'`);

  if (args.type) {
    conditions.push(`[System.WorkItemType] = '${args.type}'`);
  }
  if (args.state) {
    conditions.push(`[System.State] = '${args.state}'`);
  }
  conditions.push(`[System.AssignedTo] = '${assignedTo}'`);

  wiql += " WHERE " + conditions.join(" AND ");
  wiql += " ORDER BY [System.Id] DESC";

  const azArgs = ["query", "--wiql", wiql];
  if (args.project) {
    azArgs.push("--project", args.project);
  }

  const result = await azure("boards", azArgs, { format: "json" });

  return {
    work_items: result,
    filters: {
      project: args.project,
      type: args.type,
      state: args.state,
      assigned_to: assignedTo,
    },
    query: wiql,
    timestamp: new Date().toISOString(),
  };
});

export async function getPipelines(args: { project: string }): Promise<Result> {
  const azArgs = ["list", "--project", args.project];
  const result = await azure("pipelines", azArgs, { format: "json" });

  return {
    pipelines: result,
    project: args.project,
    timestamp: new Date().toISOString(),
  };
}

export async function getBranches(args: {
  project: string;
  repository: string;
}): Promise<Result> {
  const azArgs = [
    "ref",
    "list",
    "--project",
    args.project,
    "--repository",
    args.repository,
  ];

  const result = await azure("repos", azArgs, { format: "json" });
  return {
    branches: result,
    project: args.project,
    repository: args.repository,
    timestamp: new Date().toISOString(),
  };
}

export async function getPullRequests(args: {
  project: string;
  repository: string;
  status?: string | undefined;
}): Promise<Result> {
  const azArgs = [
    "pr",
    "list",
    "--project",
    args.project,
    "--repository",
    args.repository,
  ];

  if (args.status) {
    azArgs.push("--status", args.status);
  }

  const result = await azure("repos", azArgs, { format: "json" });

  return {
    pull_requests: result,
    filters: {
      project: args.project,
      repository: args.repository,
      status: args.status,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function sendEmail(args: {
  to: string[];
  subject: string;
  sender: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  importance?: "high" | "low" | "normal";
  disableTracking?: boolean;
}): Promise<Result> {
  const azArgs = [
    "email",
    "send",
    "--sender",
    args.sender,
    "--subject",
    args.subject,
    "--to",
    ...args.to,
  ];

  if (args.text) {
    azArgs.push("--text", args.text);
  }

  if (args.html) {
    azArgs.push("--html", args.html);
  }

  if (args.cc && args.cc.length > 0) {
    azArgs.push("--cc", ...args.cc);
  }

  if (args.bcc && args.bcc.length > 0) {
    azArgs.push("--bcc", ...args.bcc);
  }

  if (args.replyTo && args.replyTo.length > 0) {
    azArgs.push("--reply-to", ...args.replyTo);
  }

  if (args.importance) {
    azArgs.push("--importance", args.importance);
  }

  if (args.disableTracking) {
    azArgs.push("--disable-tracking", "true");
  }

  const result = await azure("communication", azArgs, {
    format: "json",
    organization: false
  });

  return {
    email_result: result,
    recipients: {
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
    },
    subject: args.subject,
    sender: args.sender,
    timestamp: new Date().toISOString(),
  };
}
