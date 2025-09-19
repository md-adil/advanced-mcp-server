import { FileInfo } from "../types.ts";

// Individual tool functions
export async function readFile(args: { path: string; encoding?: string }) {
  const content = await Deno.readTextFile(args.path);
  if (args.encoding === "base64") {
    return { content: btoa(content), encoding: "base64" };
  }
  return { content, encoding: "utf8" };
}

export async function writeFile(args: {
  path: string;
  content: string;
  mode?: string;
}) {
  const options: Deno.WriteFileOptions = {};
  if (args.mode === "append") {
    options.append = true;
  } else if (args.mode === "create") {
    options.createNew = true;
  }

  await Deno.writeTextFile(args.path, args.content, options);
  return { success: true, message: `File written to ${args.path}` };
}

export async function listDirectory(args: {
  path?: string;
  recursive?: boolean;
  include_hidden?: boolean;
}) {
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

export async function createDirectory(args: {
  path: string;
  recursive?: boolean;
}) {
  await Deno.mkdir(args.path, { recursive: args.recursive || false });
  return { success: true, message: `Directory created: ${args.path}` };
}

export async function deleteFile(args: { path: string; recursive?: boolean }) {
  await Deno.remove(args.path, { recursive: args.recursive || false });
  return { success: true, message: `Deleted: ${args.path}` };
}

export async function copyFile(args: {
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

export async function moveFile(args: { source: string; destination: string }) {
  await Deno.rename(args.source, args.destination);
  return {
    success: true,
    message: `Moved ${args.source} to ${args.destination}`,
  };
}

export async function statFile(args: { path: string }) {
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

export async function watchFile(args: {
  path: string;
  recursive?: boolean;
  duration?: number;
}) {
  const changes: Array<{ kind: string; paths: string[]; timestamp: string }> =
    [];
  const watcher = Deno.watchFs(args.path, {
    recursive: args.recursive || false,
  });

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
