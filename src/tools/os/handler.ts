import { encodeBase64 } from "@std/encoding/base64";
import {
  createToolResponse,
  createTextContent,
  createImageContent,
  ToolResult
} from "../../types/tool-response.ts";

async function executeOsascript(args: { script: string; language?: string }): Promise<ToolResult> {
  const language = args.language || "applescript";
  const languageFlag = language === "javascript" ? "-l JavaScript" : "";

  try {
    const command = new Deno.Command("osascript", {
      args: languageFlag
        ? ["-l", "JavaScript", "-e", args.script]
        : ["-e", args.script],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout);
    const error = new TextDecoder().decode(stderr);

    return {
      success: code === 0,
      exitCode: code,
      language,
      output: output.trim(),
      error: error.trim() || null,
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
      language,
      output: "",
      error: (error as Error).message,
    };
  }
}

async function executeCommand(args: {
  command: string;
  args?: string[];
  timeout?: number;
}): Promise<ToolResult> {
  try {
    const command = new Deno.Command(args.command, {
      args: args.args || [],
      stdout: "piped",
      stderr: "piped",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      args.timeout || 30000
    );

    const { code, stdout, stderr } = await command.output();
    clearTimeout(timeoutId);

    return {
      success: code === 0,
      exitCode: code,
      command: args.command,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
      command: args.command,
      stdout: "",
      stderr: (error as Error).message,
    };
  }
}

async function takeScreenshot(args: {
  region?: string;
  format?: string;
  path?: string;
  delay?: number;
}): Promise<ToolResult> {
  const region = args.region || "selection"; // Default to selection for interactive use
  const format = args.format || "png";
  const delay = args.delay || 0;

  // Generate filename with timestamp in temp directory for easy access
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tempDir = "/tmp";
  const filename = `screenshot-${timestamp}.${format}`;
  const filepath = args.path || `${tempDir}/${filename}`;

  try {
    const screencaptureArgs = [];

    // Add delay if specified
    if (delay > 0) {
      screencaptureArgs.push("-T", delay.toString());
    }

    // Add region-specific options
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

    const command = new Deno.Command("screencapture", {
      args: screencaptureArgs,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await command.output();
    const error = new TextDecoder().decode(stderr);

    if (code === 0) {
      try {
        const imageBytes = await Deno.readFile(filepath);
        const base64Data = encodeBase64(imageBytes);

        return createToolResponse(
          createTextContent("Screenshot captured successfully! Here's what you shared:"),
          createImageContent(base64Data, `image/${format === "jpg" ? "jpeg" : format}`)
        );
      } catch (readError) {
        return createToolResponse(
          createTextContent(`Screenshot saved but failed to read file: ${(readError as Error).message}`)
        );
      }
    } else {
      return createToolResponse(
        createTextContent(`Screenshot failed: ${error || "Unknown error"}. Make sure you selected an area or window.`)
      );
    }
  } catch (error) {
    return createToolResponse(
      createTextContent(`Screenshot error: ${(error as Error).message}`)
    );
  }
}

export function executeOsTool(name: string, args: Record<string, unknown>): ToolResult {
  switch (name) {
    case "os_osascript":
      return executeOsascript(
        args as {
          script: string;
          language?: string;
        }
      );
    case "os_command":
      return executeCommand(
        args as {
          command: string;
          args?: string[];
          timeout?: number;
        }
      );
    case "os_screenshot":
      return takeScreenshot(
        args as {
          region?: string;
          format?: string;
          path?: string;
          delay?: number;
        }
      );
    default:
      throw new Error(`Unknown OS tool: ${name}`);
  }
}
