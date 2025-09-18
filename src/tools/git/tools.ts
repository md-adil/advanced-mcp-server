export const gitTools = [
  {
    name: "git_status",
    description: "Get git repository status",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Repository path", default: "." },
      },
    },
  },
  {
    name: "git_add",
    description: "Add files to git staging area",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to add",
        },
        all: { type: "boolean", description: "Add all files", default: false },
      },
    },
  },
  {
    name: "git_commit",
    description: "Create a git commit",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Commit message" },
        author: { type: "string", description: "Author name and email" },
        amend: {
          type: "boolean",
          description: "Amend previous commit",
          default: false,
        },
      },
      required: ["message"],
    },
  },
  {
    name: "git_push",
    description: "Push commits to remote repository",
    inputSchema: {
      type: "object",
      properties: {
        remote: {
          type: "string",
          description: "Remote name",
          default: "origin",
        },
        branch: { type: "string", description: "Branch name" },
        force: { type: "boolean", description: "Force push", default: false },
      },
    },
  },
  {
    name: "git_pull",
    description: "Pull changes from remote repository",
    inputSchema: {
      type: "object",
      properties: {
        remote: {
          type: "string",
          description: "Remote name",
          default: "origin",
        },
        branch: { type: "string", description: "Branch name" },
        rebase: {
          type: "boolean",
          description: "Use rebase instead of merge",
          default: false,
        },
      },
    },
  },
  {
    name: "git_branch",
    description: "Manage git branches",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "create", "delete", "switch"],
          default: "list",
        },
        name: { type: "string", description: "Branch name" },
        force: { type: "boolean", description: "Force action", default: false },
      },
    },
  },
  {
    name: "git_log",
    description: "Show git commit history",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of commits to show",
          default: 10,
        },
        oneline: {
          type: "boolean",
          description: "Show one line per commit",
          default: false,
        },
        author: { type: "string", description: "Filter by author" },
        since: { type: "string", description: "Show commits since date" },
      },
    },
  },
  {
    name: "git_diff",
    description: "Show git differences",
    inputSchema: {
      type: "object",
      properties: {
        staged: {
          type: "boolean",
          description: "Show staged changes",
          default: false,
        },
        file: { type: "string", description: "Specific file to diff" },
        commit: {
          type: "string",
          description: "Compare against specific commit",
        },
      },
    },
  },
  {
    name: "git_stash",
    description: "Manage git stash",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["push", "pop", "list", "apply", "drop"],
          default: "push",
        },
        message: { type: "string", description: "Stash message" },
        index: { type: "number", description: "Stash index" },
      },
    },
  },
  {
    name: "git_clone",
    description: "Clone a git repository",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Repository URL" },
        destination: { type: "string", description: "Local directory" },
        branch: { type: "string", description: "Specific branch to clone" },
        depth: { type: "number", description: "Clone depth" },
      },
      required: ["url"],
    },
  },
];