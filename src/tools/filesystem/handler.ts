import { FileInfo } from "../../types.ts";
import { ToolResult } from "../../types/tool-response.ts";

// Individual tool functions
async function readFile(args: { path: string; encoding?: string }): Promise<ToolResult> {
  const content = await Deno.readTextFile(args.path);
  if (args.encoding === "base64") {
    return { content: btoa(content), encoding: "base64" };
  }
  return { content, encoding: "utf8" };
}

async function writeFile(args: { path: string; content: string; mode?: string }): Promise<ToolResult> {
  const options: Deno.WriteFileOptions = {};
  if (args.mode === "append") {
    options.append = true;
  } else if (args.mode === "create") {
    options.createNew = true;
  }

  await Deno.writeTextFile(args.path, args.content, options);
  return { success: true, message: `File written to ${args.path}` };
}

async function listDirectory(args: {
  path?: string;
  recursive?: boolean;
  include_hidden?: boolean;
}): Promise<ToolResult> {
  const entries: FileInfo[] = [];
  const path = args.path || ".";

  for await (const entry of Deno.readDir(path)) {
    if (!args.include_hidden && entry.name.startsWith(".")) continue;

    const info = await Deno.stat(`${path}/${entry.name}`);
    entries.push({
      name: entry.name,
      type: entry.isDirectory ? "directory" : "file",
      size: info.size ?? 0,
      modified: info.mtime?.toISOString() || "",
    });

    if (args.recursive && entry.isDirectory) {
      const subEntries = await listDirectory({
        path: `${path}/${entry.name}`,
        recursive: true,
        include_hidden: args.include_hidden || false,
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

async function createDirectory(args: { path: string; recursive?: boolean }): Promise<ToolResult> {
  await Deno.mkdir(args.path, { recursive: args.recursive || false });
  return { success: true, message: `Directory created: ${args.path}` };
}

async function deleteFile(args: { path: string; recursive?: boolean }): Promise<ToolResult> {
  await Deno.remove(args.path, { recursive: args.recursive || false });
  return { success: true, message: `Deleted: ${args.path}` };
}

async function copyFile(args: {
  source: string;
  destination: string;
  overwrite?: boolean;
}): Promise<ToolResult> {
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

async function moveFile(args: { source: string; destination: string }): Promise<ToolResult> {
  await Deno.rename(args.source, args.destination);
  return {
    success: true,
    message: `Moved ${args.source} to ${args.destination}`,
  };
}

async function statFile(args: { path: string }): Promise<ToolResult> {
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

async function watchFile(args: { path: string; recursive?: boolean; duration?: number }): Promise<ToolResult> {
  const changes: Array<{ kind: string; paths: string[]; timestamp: string }> = [];
  const watcher = Deno.watchFs(args.path, { recursive: args.recursive || false });

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

// Main execution function - handles all filesystem tool cases
export async function executeFilesystemTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case "fs_read_file":
      return await readFile(args as { path: string; encoding?: string });
    case "fs_write_file":
      return await writeFile(args as { path: string; content: string; mode?: string });
    case "fs_list_directory":
      return await listDirectory(args as { path?: string; recursive?: boolean; include_hidden?: boolean });
    case "fs_create_directory":
      return await createDirectory(args as { path: string; recursive?: boolean });
    case "fs_delete":
      return await deleteFile(args as { path: string; recursive?: boolean });
    case "fs_copy":
      return await copyFile(args as { source: string; destination: string; overwrite?: boolean });
    case "fs_move":
      return await moveFile(args as { source: string; destination: string });
    case "fs_stat":
      return await statFile(args as { path: string });
    case "fs_watch":
      return await watchFile(args as { path: string; recursive?: boolean; duration?: number });
    default:
      throw new Error(`Unknown filesystem tool: ${name}`);
  }
}