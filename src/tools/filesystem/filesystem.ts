import { FileInfo } from "./filesystem/filesystem.ts";

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

export class FilesystemHandler {
  async readFile(args: { path: string; encoding?: string }) {
    const content = await Deno.readTextFile(args.path);
    if (args.encoding === "base64") {
      return { content: btoa(content), encoding: "base64" };
    }
    return { content, encoding: "utf8" };
  }

  async writeFile(args: { path: string; content: string; mode?: string }) {
    const options: Deno.WriteFileOptions = {};
    if (args.mode === "append") {
      options.append = true;
    } else if (args.mode === "create") {
      options.createNew = true;
    }

    await Deno.writeTextFile(args.path, args.content, options);
    return { success: true, message: `File written to ${args.path}` };
  }

  async listDirectory(args: {
    path?: string;
    recursive?: boolean;
    include_hidden?: boolean;
  }): Promise<{ entries: FileInfo[]; count: number }> {
    const entries: FileInfo[] = [];
    const path = args.path || ".";

    for await (const entry of Deno.readDir(path)) {
      if (!args.include_hidden && entry.name.startsWith(".")) continue;

      const info = await Deno.stat(`${path}/${entry.name}`);
      entries.push({
        name: entry.name,
        type: entry.isDirectory ? "directory" : "file",
        size: info.size ?? 0,
        modified: info.mtime?.toISOString()!,
      });

      if (args.recursive && entry.isDirectory) {
        const subEntries = await this.listDirectory({
          path: `${path}/${entry.name}`,
          recursive: true,
          include_hidden: args.include_hidden!,
        });
        entries.push(
          ...subEntries.entries.map((e) => ({
            ...e,
            name: `${entry.name}/${e.name}`,
          }))
        );
      }
    }

    return { entries, count: entries.length };
  }

  async createDirectory(args: { path: string; recursive?: boolean }) {
    await Deno.mkdir(args.path, { recursive: args.recursive! });
    return { success: true, message: `Directory created: ${args.path}` };
  }

  async delete(args: { path: string; recursive?: boolean }) {
    await Deno.remove(args.path, { recursive: args.recursive! });
    return { success: true, message: `Deleted: ${args.path}` };
  }

  async copy(args: {
    source: string;
    destination: string;
    overwrite?: boolean;
  }) {
    if (!args.overwrite) {
      try {
        await Deno.stat(args.destination);
        throw new Error("Destination exists and overwrite is false");
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }

    await Deno.copyFile(args.source, args.destination);
    return {
      success: true,
      message: `Copied ${args.source} to ${args.destination}`,
    };
  }

  async move(args: { source: string; destination: string }) {
    await Deno.rename(args.source, args.destination);
    return {
      success: true,
      message: `Moved ${args.source} to ${args.destination}`,
    };
  }

  async stat(args: { path: string }) {
    const info = await Deno.stat(args.path);
    return {
      size: info.size,
      isFile: info.isFile,
      isDirectory: info.isDirectory,
      isSymlink: info.isSymlink,
      created: info.birthtime?.toISOString(),
      modified: info.mtime?.toISOString(),
      accessed: info.atime?.toISOString(),
      mode: info.mode,
      uid: info.uid,
      gid: info.gid,
    };
  }

  async watch(args: { path: string; recursive?: boolean; duration?: number }) {
    const changes: Array<{ kind: string; paths: string[]; timestamp: string }> =
      [];
    const watcher = Deno.watchFs(args.path, { recursive: args.recursive! });

    const timeout = setTimeout(() => {
      watcher.return?.();
    }, (args.duration ?? 60) * 1000);

    try {
      for await (const event of watcher) {
        changes.push({
          kind: event.kind,
          paths: event.paths,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      clearTimeout(timeout);
    }

    return { changes, duration: args.duration ?? 60 };
  }
}
