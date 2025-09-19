import { azure } from "./cli.ts";
import { LoggedInUser, Project, User } from "./types.ts";

type Result = Record<string, unknown>;

export async function getProjects(): Promise<Project[]> {
  const result = await azure("devops", ["project", "list"], { format: "json" });
  if (!result) throw new Error("Unable to fetch projects");
  return (result as any).value;
}

export async function getRepositories(args: {
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
}

export async function getUsers(args: {
  project?: string | undefined;
}): Promise<User[]> {
  const azArgs = ["user", "list"];
  if (args.project) {
    azArgs.push("--project", args.project);
  }
  azArgs.push("--query", "items[].user");
  const result = await azure("devops", azArgs, { format: "json" });
  return result as User[];
}

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

export async function getCurrentUser(): Promise<LoggedInUser> {
  const result = await azure("account", ["show"], {
    format: "json",
    organization: false,
  });
  return result as LoggedInUser;
}

export async function getWorkItems(args: {
  project?: string | undefined;
  type?: string | undefined;
  state?: string | undefined;
  assigned_to?: string | undefined;
}): Promise<Result> {
  // Get current user if assigned_to is not defined
  const assignedTo = args.assigned_to ?? (await getCurrentUser()).user.name;
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
}

export function getTasks(args: {
  project?: string | undefined;
  assigned_to?: string | undefined;
}): Promise<Result> {
  return getWorkItems({
    ...args,
    type: "Task",
  });
}

export function getUserStories(args: {
  project?: string | undefined;
  state?: string | undefined;
}): Promise<Result> {
  return getWorkItems({
    ...args,
    type: "User Story",
  });
}

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
