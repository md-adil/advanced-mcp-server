#!/usr/bin/env -S deno run --allow-all

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { Logger } from "./utils/logger.ts";
import { MemoryCache } from "./utils/cache.ts";

import {
  executeFilesystemTool,
  filesystemTools,
} from "./tools/filesystem/index.ts";
import { executeGitTool, gitTools } from "./tools/git/index.ts";
import { executeDockerTool, dockerTools } from "./tools/docker/index.ts";
import {
  executeWebSocketTool,
  websocketTools,
} from "./tools/websocket/index.ts";
import {
  executeBenchmarkTool,
  benchmarkTools,
} from "./tools/benchmark/index.ts";
import { executeElasticTool, elasticTools } from "./tools/elastic/index.ts";
import { executeCacheTool, cacheTools } from "./tools/cache/index.ts";
import {
  executeMetricsTool,
  MetricsCollector,
  metricsTools,
} from "./tools/metrics/index.ts";
import { executeHttpTool, httpTools } from "./tools/http/index.ts";
import { executeCommandTool, commandTools } from "./tools/command/index.ts";
import { setupResourceHandlers } from "./resources/index.ts";
import { setupPromptHandlers } from "./prompts/index.ts";

export class AdvancedMCPServer {
  private server: Server;
  private logger: Logger;
  private cache: MemoryCache;
  private metricsCollector: MetricsCollector;

  // Legacy handlers for websocket cleanup (will be removed after full refactor)
  private wsHandler: any;

  constructor() {
    this.logger = new Logger();
    this.cache = new MemoryCache();
    this.metricsCollector = new MetricsCollector(this.logger);

    // Initialize only the websocket handler for cleanup (will be lazy-loaded)
    this.wsHandler = null;

    this.server = new Server(
      {
        name: "advanced-mcp-server",
        version: "3.0.0",
        description: "Modular advanced MCP server with comprehensive toolset",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {},
        },
      }
    );

    this.setupHandlers();

    // Setup modular handlers
    setupResourceHandlers(
      this.server,
      this.logger,
      this.cache,
      this.metricsCollector
    );
    setupPromptHandlers(this.server);
    this.metricsCollector.startCollection();
  }

  private setupHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      this.logger.info("Listed available tools");
      return {
        tools: [
          ...filesystemTools,
          ...gitTools,
          ...dockerTools,
          ...websocketTools,
          ...benchmarkTools,
          ...elasticTools,
          ...cacheTools,
          ...metricsTools,
          ...httpTools,
          ...commandTools,
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.info(`Executing tool: ${name}`, { args });

      try {
        const result = await this.executeTool(name, args);
        this.logger.info(`Tool ${name} executed successfully`);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        this.logger.error(`Tool ${name} failed`, {
          error: (error as Error).message,
          args,
        });
        return {
          content: [
            {
              type: "text",
              text: `❌ Error executing ${name}: ${(error as Error).message}`,
            },
          ],
        };
      }
    });

    // Resources and prompts are handled by modular handlers
  }

  private async executeTool(name: string, args: any): Promise<any> {
    // Filesystem operations
    if (name.startsWith("fs_")) {
      return await executeFilesystemTool(name, args);
    }

    // Git operations
    if (name.startsWith("git_")) {
      return await executeGitTool(name, args);
    }

    // Docker operations
    if (name.startsWith("docker_")) {
      return await executeDockerTool(name, args);
    }

    // WebSocket operations
    if (name.startsWith("ws_")) {
      return await executeWebSocketTool(name, args);
    }

    // Benchmark operations
    if (name.startsWith("benchmark_")) {
      return await executeBenchmarkTool(name, args);
    }

    // Elastic operations
    if (name.startsWith("elastic_")) {
      return await executeElasticTool(name, args);
    }

    // Cache operations
    if (name.startsWith("cache_")) {
      return executeCacheTool(this.cache, name, args);
    }

    // Metrics operations
    if (name.startsWith("metrics_")) {
      return await executeMetricsTool(this.metricsCollector, name, args);
    }

    // HTTP operations
    if (name === "http_request") {
      return await executeHttpTool(name, args);
    }

    // Command operations
    if (name === "exec_command") {
      return await executeCommandTool(name, args);
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  async start() {
    (globalThis as any).startTime = Date.now();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info("🚀 Advanced Modular MCP Server v3.0 is running!");
  }

  async cleanup() {
    this.metricsCollector.stopCollection();
    // Initialize websocket handler for cleanup if needed
    if (!this.wsHandler) {
      const { WebSocketHandler } = await import("./tools/websocket.ts");
      this.wsHandler = new WebSocketHandler();
    }
    await this.wsHandler.cleanup();
    this.logger.info("Server cleanup completed");
  }
}

// Start the server
if (import.meta.main) {
  const server = new AdvancedMCPServer();

  // Handle graceful shutdown
  Deno.addSignalListener("SIGINT", async () => {
    console.log("\nShutting down server...");
    await server.cleanup();
    Deno.exit(0);
  });

  await server.start();
}
