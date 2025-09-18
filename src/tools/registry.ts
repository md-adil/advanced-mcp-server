// Centralized tool registry that automatically imports and manages all tools
import { ToolResult } from "../types/tool-response.ts";

// Import all tool modules
import { filesystemTools, executeFilesystemTool } from "./filesystem/index.ts";
import { gitTools, executeGitTool } from "./git/index.ts";
import { dockerTools, executeDockerTool } from "./docker/index.ts";
import { websocketTools, executeWebSocketTool } from "./websocket/index.ts";
import { benchmarkTools, executeBenchmarkTool } from "./benchmark/index.ts";
import { elasticTools, executeElasticTool } from "./elastic/index.ts";
import { cacheTools, executeCacheTool } from "./cache/index.ts";
import { metricsTools, executeMetricsTool } from "./metrics/index.ts";
import { httpTools, executeHttpTool } from "./http/index.ts";
import { commandTools, executeCommandTool } from "./command/index.ts";
import { osTools, executeOsTool } from "./os/index.ts";
import { kubernetesTools, executeKubernetesTool } from "./kubernetes/index.ts";

// Tool executor function type
export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>
) => Promise<ToolResult> | ToolResult;

// Tool category registry - automatically aggregates all tools
export const toolRegistry = {
  filesystem: { tools: filesystemTools, executor: executeFilesystemTool },
  git: { tools: gitTools, executor: executeGitTool },
  docker: { tools: dockerTools, executor: executeDockerTool },
  websocket: { tools: websocketTools, executor: executeWebSocketTool },
  benchmark: { tools: benchmarkTools, executor: executeBenchmarkTool },
  elastic: { tools: elasticTools, executor: executeElasticTool },
  cache: { tools: cacheTools, executor: executeCacheTool },
  // metrics: { tools: metricsTools, executor: executeMetricsTool },
  http: { tools: httpTools, executor: executeHttpTool },
  command: { tools: commandTools, executor: executeCommandTool },
  os: { tools: osTools, executor: executeOsTool },
  kubernetes: { tools: kubernetesTools, executor: executeKubernetesTool },
} as const;

// Tool definition interface for better type safety
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

// Get all tools as a flat array
export function getAllTools(): ToolDefinition[] {
  return Object.values(toolRegistry).flatMap(
    (category) => category.tools as ToolDefinition[]
  );
}

// Get tools summary by category
export function getToolsSummary() {
  return Object.fromEntries(
    Object.entries(toolRegistry).map(([category, { tools }]) => [
      category,
      {
        count: tools.length,
        tools: tools.map((t) => t.name),
      },
    ])
  );
}

// Execute any tool by name - automatically routes to correct executor
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // Special handling for tools that need dependencies

  // Auto-route to appropriate executor based on tool prefix
  for (const [category, { executor }] of Object.entries(toolRegistry)) {
    const prefix = getToolPrefix(category);
    if (
      name.startsWith(prefix) ||
      (category === "http" && name === "http_request") ||
      (category === "command" && name === "exec_command")
    ) {
      // Call the executor with proper typing
      return await executor(name, args);
    }
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Helper to get tool prefix for a category
function getToolPrefix(category: string): string {
  switch (category) {
    case "filesystem":
      return "fs_";
    case "websocket":
      return "ws_";
    case "http":
      return "http_";
    case "command":
      return "exec_";
    default:
      return `${category}_`;
  }
}
