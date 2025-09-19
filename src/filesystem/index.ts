import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import {
  readFile,
  writeFile,
  listDirectory,
  createDirectory,
  deleteFile,
  copyFile,
  moveFile,
  statFile,
  watchFile,
} from "./handler.ts";
import { wrapAsTextResponse } from "../utils/tools.ts";

export function filesystemModule(server: McpServer) {
  server.registerTool(
    "fs_read_file",
    {
      inputSchema: {
        path: z.string().describe("File path to read"),
        encoding: z.string().default("utf8").describe("file encoding"),
      },
    },
    async ({ path, encoding }) => {
      return wrapAsTextResponse(await readFile({ path, encoding }));
    }
  );

  server.registerTool(
    "fs_write_file",
    {
      inputSchema: {
        path: z.string().describe("File path to write"),
        content: z.string().describe("Content to write"),
        mode: z
          .string()
          .default("create")
          .describe("Write mode: create, append, or overwrite"),
      },
    },
    async ({ path, content, mode }) => {
      return wrapAsTextResponse(await writeFile({ path, content, mode }));
    }
  );

  server.registerTool(
    "fs_list_directory",
    {
      inputSchema: {
        path: z.string().default(".").describe("Directory path"),
        recursive: z.boolean().default(false).describe("List recursively"),
        include_hidden: z
          .boolean()
          .default(false)
          .describe("Include hidden files"),
      },
    },
    async ({ path, recursive, include_hidden }) => {
      return wrapAsTextResponse(
        await listDirectory({ path, recursive, include_hidden })
      );
    }
  );

  server.registerTool(
    "fs_create_directory",
    {
      inputSchema: {
        path: z.string().describe("Directory path to create"),
        recursive: z
          .boolean()
          .default(true)
          .describe("Create parent directories"),
      },
    },
    async ({ path, recursive }) => {
      return wrapAsTextResponse(await createDirectory({ path, recursive }));
    }
  );

  server.registerTool(
    "fs_delete",
    {
      inputSchema: {
        path: z.string().describe("Path to delete"),
        recursive: z
          .boolean()
          .default(false)
          .describe("Delete recursively for directories"),
      },
    },
    async ({ path, recursive }) => {
      return wrapAsTextResponse(await deleteFile({ path, recursive }));
    }
  );

  server.registerTool(
    "fs_copy",
    {
      inputSchema: {
        source: z.string().describe("Source path"),
        destination: z.string().describe("Destination path"),
        overwrite: z.boolean().default(false).describe("Overwrite if exists"),
      },
    },
    async ({ source, destination, overwrite }) => {
      return wrapAsTextResponse(
        await copyFile({ source, destination, overwrite })
      );
    }
  );

  server.registerTool(
    "fs_move",
    {
      inputSchema: {
        source: z.string().describe("Source path"),
        destination: z.string().describe("Destination path"),
      },
    },
    async ({ source, destination }) => {
      return wrapAsTextResponse(await moveFile({ source, destination }));
    }
  );

  server.registerTool(
    "fs_stat",
    {
      inputSchema: {
        path: z.string().describe("Path to analyze"),
      },
    },
    async ({ path }) => {
      return wrapAsTextResponse(await statFile({ path }));
    }
  );

  server.registerTool(
    "fs_watch",
    {
      inputSchema: {
        path: z.string().describe("Path to watch"),
        recursive: z.boolean().default(false).describe("Watch recursively"),
        duration: z.number().default(60).describe("Watch duration in seconds"),
      },
    },
    async ({ path, recursive, duration }) => {
      return wrapAsTextResponse(await watchFile({ path, recursive, duration }));
    }
  );
}
