#!/usr/bin/env -S deno run --allow-all

import { McpServer as Server } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { gitModule } from "./git/index.ts";
import { dockerModule } from "./docker/index.ts";
import { httpModule } from "./http/index.ts";
import { filesystemModule } from "./filesystem/index.ts";
import { elasticModule } from "./elastic/index.ts";
import { logger } from "./logger/index.ts";
import { azureModule } from "./azure/index.ts";

export class AdvancedMCPServer {
  private server: Server;

  // Legacy handlers for websocket cleanup (will be removed after full refactor)

  constructor() {
    this.server = new Server({
      name: "advanced-mcp-server",
      version: "1.0.0",
      description: "Modular advanced MCP server with comprehensive toolset",
    });
  }

  getModules() {
    return [
      gitModule,
      dockerModule,
      httpModule,
      filesystemModule,
      elasticModule,
      azureModule,
    ];
  }

  private registerModules() {
    const modules = this.getModules();
    modules.forEach((register) => register(this.server));
  }

  async start() {
    this.registerModules();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info("🚀 Advanced Modular MCP Server v3.0 is running!");
  }

  async cleanup() {
    await this.server.close();
    logger.info("Server cleanup completed");
  }
}

// Start the server
if (import.meta.main) {
  const server = new AdvancedMCPServer();
  Deno.addSignalListener("SIGINT", async () => {
    console.log("\nShutting down server...");
    await server.cleanup();
    Deno.exit(0);
  });

  await server.start();
}
