#!/usr/bin/env -S deno run --allow-all

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { Logger } from "./utils/logger.ts";

import { getAllTools, executeTool } from "./tools/registry.ts";
import { executeMetricsTool, MetricsCollector } from "./tools/metrics/index.ts";
import { setupResourceHandlers } from "./resources/index.ts";
import { setupPromptHandlers } from "./prompts/index.ts";
import { formatToolTextOutput } from "./tools/formatter.ts";
import { wrapAsTextResponse } from "./types/tool-response.ts";

export class AdvancedMCPServer {
  private server: Server;
  private logger: Logger;
  private metricsCollector: MetricsCollector;

  // Legacy handlers for websocket cleanup (will be removed after full refactor)
  private wsHandler: any;

  constructor() {
    this.logger = new Logger();
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
    setupResourceHandlers(this.server, this.logger, this.metricsCollector);
    setupPromptHandlers(this.server);
    this.metricsCollector.startCollection();
  }

  private setupHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      this.logger.info("Listed available tools");
      return {
        tools: getAllTools(),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.info(`Executing tool: ${name}`, { args });

      try {
        if (name.startsWith("metrics_")) {
          return formatToolTextOutput(
            await executeMetricsTool(this.metricsCollector, name, args!)
          );
        }
        const result = await executeTool(name, args!);
        this.logger.info(`Tool ${name} executed successfully`);

        // Check if tool already returned content in correct format
        if (result && typeof result === "object" && (result as any).content) {
          return result;
        }

        // Otherwise wrap in default text format
        return wrapAsTextResponse(result);
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
      const { WebSocketHandler } = await import(
        "./tools/websocket/websocket.ts"
      );
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
