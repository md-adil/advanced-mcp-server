export const filesystemTools = [
  {
    name: "fs_read_file",
    description: "Read contents of a file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
        encoding: { type: "string", enum: ["utf8", "base64"], default: "utf8" },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_write_file",
    description: "Write content to a file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to write" },
        content: { type: "string", description: "Content to write" },
        mode: {
          type: "string",
          enum: ["create", "append", "overwrite"],
          default: "create",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "fs_list_directory",
    description: "List contents of a directory",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path", default: "." },
        recursive: {
          type: "boolean",
          description: "List recursively",
          default: false,
        },
        include_hidden: {
          type: "boolean",
          description: "Include hidden files",
          default: false,
        },
      },
    },
  },
  {
    name: "fs_create_directory",
    description: "Create a directory",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path to create" },
        recursive: {
          type: "boolean",
          description: "Create parent directories",
          default: true,
        },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_delete",
    description: "Delete a file or directory",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to delete" },
        recursive: {
          type: "boolean",
          description: "Delete recursively for directories",
          default: false,
        },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_copy",
    description: "Copy a file or directory",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Source path" },
        destination: { type: "string", description: "Destination path" },
        overwrite: {
          type: "boolean",
          description: "Overwrite if exists",
          default: false,
        },
      },
      required: ["source", "destination"],
    },
  },
  {
    name: "fs_move",
    description: "Move/rename a file or directory",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Source path" },
        destination: { type: "string", description: "Destination path" },
      },
      required: ["source", "destination"],
    },
  },
  {
    name: "fs_stat",
    description: "Get file or directory statistics",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to analyze" },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_watch",
    description: "Watch a file or directory for changes",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to watch" },
        recursive: {
          type: "boolean",
          description: "Watch recursively",
          default: false,
        },
        duration: {
          type: "number",
          description: "Watch duration in seconds",
          default: 60,
        },
      },
      required: ["path"],
    },
  },
];