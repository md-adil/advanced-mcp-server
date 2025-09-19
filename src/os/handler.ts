import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { encodeBase64 } from "@std/encoding/base64";
import { executeCommand as exec } from "../utils/command.ts";
import { getTmpDir } from "../utils/tmp.ts";
import { join } from "node:path";

export function executeOsascript(args: { script: string; language?: string }) {
  const language = args.language || "applescript";
  const languageFlag = language === "javascript";

  return exec(
    "osascript",
    languageFlag ? ["-l", "JavaScript", "-e", args.script] : ["-e", args.script]
  );
}

export function executeCommand(args: {
  command: string;
  args: string[];
  timeout?: number;
}) {
  return exec(args.command, args.args ?? [], { timeout: args.timeout! });
}

export async function takeScreenshot(args: {
  region: string;
  format: string;
  delay: number;
}): Promise<CallToolResult> {
  const region = args.region; // Default to selection for interactive use
  const format = args.format;
  const delay = args.delay;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tempDir = await getTmpDir("screenshots");
  const filename = `${timestamp}.${format}`;
  const filepath = join(tempDir, filename);
  const screencaptureArgs = [];
  if (delay > 0) {
    screencaptureArgs.push("-T", delay.toString());
  }

  switch (region) {
    case "window":
      screencaptureArgs.push("-w"); // Window mode - user clicks window
      break;
    case "selection":
      screencaptureArgs.push("-s"); // Selection mode - user drags to select area
      break;
    case "fullscreen":
    default:
      // No additional flags for fullscreen
      break;
  }

  // Add format if not PNG (PNG is default)
  if (format === "jpg") {
    screencaptureArgs.push("-t", "jpg");
  } else if (format === "pdf") {
    screencaptureArgs.push("-t", "pdf");
  }

  // Add output path
  screencaptureArgs.push(filepath);

  await exec("screencapture", screencaptureArgs);

  const fileBytes = await Deno.readFile(filepath);

  return {
    content: [
      {
        type: "text",
        text: "Screenshot captured successfully! Here's what you shared:",
      },
      {
        type: "image",
        mimeType: `image/${format === "jpg" ? "jpeg" : format}`,
        data: encodeBase64(fileBytes),
      },
    ],
  };
}
