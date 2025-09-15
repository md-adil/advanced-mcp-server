#!/usr/bin/env -S deno run --allow-all

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { Logger } from "./utils/logger.ts";
import { MemoryCache } from "./utils/cache.ts";
import { SystemMetrics } from "./types.ts";

import { FilesystemHandler, filesystemTools } from "./tools/filesystem.ts";
import { GitHandler, gitTools } from "./tools/git.ts";
import { DockerHandler, dockerTools } from "./tools/docker.ts";
import { CryptoHandler, cryptoTools } from "./tools/crypto.ts";
import { WebSocketHandler, websocketTools } from "./tools/websocket.ts";
import {
  CodeAnalysisHandler,
  codeAnalysisTools,
} from "./tools/codeanalysis.ts";
import { BenchmarkHandler, benchmarkTools } from "./tools/benchmark.ts";

export class AdvancedMCPServer {
  private server: Server;
  private logger: Logger;
  private cache: MemoryCache;
  private metrics: SystemMetrics[] = [];
  private metricsInterval?: number;

  // Tool handlers
  private fsHandler: FilesystemHandler;
  private gitHandler: GitHandler;
  private dockerHandler: DockerHandler;
  private cryptoHandler: CryptoHandler;
  private wsHandler: WebSocketHandler;
  private codeHandler: CodeAnalysisHandler;
  private benchmarkHandler: BenchmarkHandler;

  constructor() {
    this.logger = new Logger();
    this.cache = new MemoryCache();

    // Initialize tool handlers
    this.fsHandler = new FilesystemHandler();
    this.gitHandler = new GitHandler();
    this.dockerHandler = new DockerHandler();
    this.cryptoHandler = new CryptoHandler();
    this.wsHandler = new WebSocketHandler();
    this.codeHandler = new CodeAnalysisHandler();
    this.benchmarkHandler = new BenchmarkHandler();

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
    this.startMetricsCollection();
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics: SystemMetrics = {
          timestamp: new Date().toISOString(),
          cpu: await this.getCpuUsage(),
          memory: await this.getMemoryUsage(),
          disk: await this.getDiskUsage(),
        };
        this.metrics.push(metrics);
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-50);
        }
      } catch (error) {
        this.logger.error("Failed to collect metrics", {
          error: (error as Error).message,
        });
      }
    }, 30000);
  }

  private stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
  }

  private async getCpuUsage(): Promise<number> {
    try {
      const process = new Deno.Command("ps", {
        args: ["-o", "pcpu", "-p", Deno.pid.toString()],
        stdout: "piped",
      });
      const { stdout } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const lines = output.trim().split("\n");
      return parseFloat(lines[1] || "0") || 0;
    } catch {
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      const process = new Deno.Command("ps", {
        args: ["-o", "pmem", "-p", Deno.pid.toString()],
        stdout: "piped",
      });
      const { stdout } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const lines = output.trim().split("\n");
      return parseFloat(lines[1] || "0") || 0;
    } catch {
      return 0;
    }
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const process = new Deno.Command("df", {
        args: ["-h", "."],
        stdout: "piped",
      });
      const { stdout } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const lines = output.trim().split("\n");
      const usageStr = lines[1]?.split(/\s+/)[4];
      return parseInt(usageStr?.replace("%", "") || "0") || 0;
    } catch {
      return 0;
    }
  }

  private setupHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.info("Listed available tools");
      return {
        tools: [
          ...filesystemTools,
          ...gitTools,
          ...dockerTools,
          ...cryptoTools,
          ...websocketTools,
          ...codeAnalysisTools,
          ...benchmarkTools,
          // System-level tools only
          {
            name: "cache_set",
            description: "Set cache value for server operations",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Cache key" },
                value: { type: "string", description: "Cache value" },
                ttl: {
                  type: "number",
                  description: "Time to live in seconds",
                  default: 3600,
                },
              },
              required: ["key", "value"],
            },
          },
          {
            name: "cache_get",
            description: "Get cached value from server",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Cache key" },
              },
              required: ["key"],
            },
          },
          {
            name: "cache_delete",
            description: "Delete cached value from server",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Cache key" },
              },
              required: ["key"],
            },
          },
          {
            name: "http_request",
            description: "Make HTTP requests",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", description: "URL to request" },
                method: {
                  type: "string",
                  enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                  default: "GET",
                },
                headers: { type: "object", description: "Request headers" },
                body: { type: "string", description: "Request body" },
                timeout: {
                  type: "number",
                  description: "Timeout in ms",
                  default: 10000,
                },
              },
              required: ["url"],
            },
          },
          {
            name: "exec_command",
            description: "Execute shell commands",
            inputSchema: {
              type: "object",
              properties: {
                command: { type: "string", description: "Command to execute" },
                args: {
                  type: "array",
                  items: { type: "string" },
                  description: "Command arguments",
                },
                cwd: { type: "string", description: "Working directory" },
                timeout: {
                  type: "number",
                  description: "Timeout in ms",
                  default: 30000,
                },
              },
              required: ["command"],
            },
          },
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

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "logs://recent",
            mimeType: "application/json",
            name: "Recent Logs",
            description: "Recent server log entries",
          },
          {
            uri: "metrics://system",
            mimeType: "application/json",
            name: "System Metrics",
            description: "System performance metrics",
          },
          {
            uri: "cache://status",
            mimeType: "application/json",
            name: "Cache Status",
            description: "Current cache status and statistics",
          },
          {
            uri: "config://server",
            mimeType: "application/json",
            name: "Server Configuration",
            description: "Current server configuration",
          },
          {
            uri: "tools://summary",
            mimeType: "application/json",
            name: "Tools Summary",
            description: "Summary of available tools by category",
          },
        ],
      };
    });

    // Read resources
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        switch (uri) {
          case "logs://recent":
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(this.logger.getRecentLogs(50), null, 2),
                },
              ],
            };

          case "metrics://system":
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(this.metrics.slice(-10), null, 2),
                },
              ],
            };

          case "cache://status":
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(this.cache.getStats(), null, 2),
                },
              ],
            };

          case "config://server":
            const config = {
              name: "advanced-mcp-server",
              version: "3.0.0",
              uptime: Date.now() - (globalThis as any).startTime,
              deno_version: Deno.version,
              capabilities: ["tools", "resources", "prompts", "logging"],
              toolCategories: [
                "filesystem",
                "git",
                "docker",
                "crypto",
                "websocket",
                "code-analysis",
                "benchmark",
                "utilities",
              ],
            };
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(config, null, 2),
                },
              ],
            };

          case "tools://summary":
            const toolsSummary = {
              filesystem: {
                count: filesystemTools.length,
                tools: filesystemTools.map((t) => t.name),
              },
              git: {
                count: gitTools.length,
                tools: gitTools.map((t) => t.name),
              },
              docker: {
                count: dockerTools.length,
                tools: dockerTools.map((t) => t.name),
              },
              crypto: {
                count: cryptoTools.length,
                tools: cryptoTools.map((t) => t.name),
              },
              websocket: {
                count: websocketTools.length,
                tools: websocketTools.map((t) => t.name),
              },
              codeAnalysis: {
                count: codeAnalysisTools.length,
                tools: codeAnalysisTools.map((t) => t.name),
              },
              benchmark: {
                count: benchmarkTools.length,
                tools: benchmarkTools.map((t) => t.name),
              },
              utilities: {
                count: 5,
                tools: [
                  "cache_set",
                  "cache_get",
                  "cache_delete",
                  "http_request",
                  "exec_command",
                ],
              },
            };
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(toolsSummary, null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      }
    );

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "code_review",
            description: "Comprehensive code review prompt",
            arguments: [
              {
                name: "language",
                description: "Programming language",
                required: true,
              },
              { name: "code", description: "Code to review", required: true },
            ],
          },
          {
            name: "debug_analysis",
            description: "Debug and analyze errors",
            arguments: [
              {
                name: "error_message",
                description: "Error message to analyze",
                required: true,
              },
              {
                name: "context",
                description: "Additional context",
                required: false,
              },
            ],
          },
          {
            name: "performance_optimization",
            description: "Performance optimization suggestions",
            arguments: [
              {
                name: "code_type",
                description: "Type of code (frontend, backend, etc.)",
                required: true,
              },
              {
                name: "current_metrics",
                description: "Current performance metrics",
                required: false,
              },
            ],
          },
          {
            name: "security_audit",
            description: "Security audit checklist",
            arguments: [
              {
                name: "application_type",
                description: "Type of application",
                required: true,
              },
              {
                name: "tech_stack",
                description: "Technology stack used",
                required: false,
              },
            ],
          },
        ],
      };
    });

    // Get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const prompts: Record<string, any> = {
        code_review: {
          description: "Comprehensive code review prompt",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please review this ${args?.language || "code"} for:
1. Code quality and best practices
2. Performance considerations
3. Security vulnerabilities
4. Maintainability issues
5. Potential bugs
6. Documentation completeness

Code to review:
\`\`\`${args?.language || "text"}
${args?.code || ""}
\`\`\`

Provide detailed feedback with specific suggestions for improvement.`,
              },
            },
          ],
        },
        debug_analysis: {
          description: "Debug and analyze errors",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please analyze this error and provide debugging guidance:

Error: ${args?.error_message || ""}

${args?.context ? `Context: ${args.context}` : ""}

Please provide:
1. Likely causes of this error
2. Step-by-step debugging approach
3. Potential solutions
4. Prevention strategies`,
              },
            },
          ],
        },
        performance_optimization: {
          description: "Performance optimization suggestions",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please provide performance optimization suggestions for ${
                  args?.code_type || "this application"
                }.

${args?.current_metrics ? `Current metrics: ${args.current_metrics}` : ""}

Focus on:
1. Algorithmic improvements
2. Resource utilization
3. Caching strategies
4. Database optimization (if applicable)
5. Monitoring and profiling recommendations
6. Infrastructure considerations`,
              },
            },
          ],
        },
        security_audit: {
          description: "Security audit checklist",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please provide a security audit checklist for a ${
                  args?.application_type || "web application"
                }.

${args?.tech_stack ? `Technology stack: ${args.tech_stack}` : ""}

Include:
1. Authentication and authorization
2. Input validation and sanitization
3. Data encryption and storage
4. API security
5. Infrastructure security
6. Dependency management
7. Logging and monitoring
8. Compliance considerations`,
              },
            },
          ],
        },
      };

      const prompt = prompts[name];
      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      return prompt;
    });
  }

  private async executeTool(name: string, args: any): Promise<any> {
    // Filesystem operations
    if (name.startsWith("fs_")) {
      switch (name) {
        case "fs_read_file":
          return await this.fsHandler.readFile(args);
        case "fs_write_file":
          return await this.fsHandler.writeFile(args);
        case "fs_list_directory":
          return await this.fsHandler.listDirectory(args);
        case "fs_create_directory":
          return await this.fsHandler.createDirectory(args);
        case "fs_delete":
          return await this.fsHandler.delete(args);
        case "fs_copy":
          return await this.fsHandler.copy(args);
        case "fs_move":
          return await this.fsHandler.move(args);
        case "fs_stat":
          return await this.fsHandler.stat(args);
        case "fs_watch":
          return await this.fsHandler.watch(args);
      }
    }

    // Git operations
    if (name.startsWith("git_")) {
      switch (name) {
        case "git_status":
          return await this.gitHandler.status(args);
        case "git_add":
          return await this.gitHandler.add(args);
        case "git_commit":
          return await this.gitHandler.commit(args);
        case "git_push":
          return await this.gitHandler.push(args);
        case "git_pull":
          return await this.gitHandler.pull(args);
        case "git_branch":
          return await this.gitHandler.branch(args);
        case "git_log":
          return await this.gitHandler.log(args);
        case "git_diff":
          return await this.gitHandler.diff(args);
        case "git_stash":
          return await this.gitHandler.stash(args);
        case "git_clone":
          return await this.gitHandler.clone(args);
      }
    }

    // Docker operations
    if (name.startsWith("docker_")) {
      switch (name) {
        case "docker_list_containers":
          return await this.dockerHandler.listContainers(args);
        case "docker_run":
          return await this.dockerHandler.run(args);
        case "docker_stop":
          return await this.dockerHandler.stop(args);
        case "docker_start":
          return await this.dockerHandler.start(args);
        case "docker_remove":
          return await this.dockerHandler.remove(args);
        case "docker_logs":
          return await this.dockerHandler.logs(args);
        case "docker_exec":
          return await this.dockerHandler.exec(args);
        case "docker_images":
          return await this.dockerHandler.images(args);
        case "docker_build":
          return await this.dockerHandler.build(args);
        case "docker_pull":
          return await this.dockerHandler.pull(args);
        case "docker_compose":
          return await this.dockerHandler.compose(args);
      }
    }

    // Crypto operations
    if (name.startsWith("crypto_")) {
      switch (name) {
        case "crypto_get_price":
          return await this.cryptoHandler.getPrice(args);
        case "crypto_portfolio":
          return await this.cryptoHandler.calculatePortfolio(args);
        case "crypto_generate_wallet":
          return await this.cryptoHandler.generateWallet(args);
        case "crypto_market_overview":
          return await this.cryptoHandler.marketOverview(args);
      }
    }

    // WebSocket operations
    if (name.startsWith("ws_")) {
      switch (name) {
        case "ws_connect":
          return await this.wsHandler.connect(args);
        case "ws_send":
          return await this.wsHandler.send(args);
        case "ws_listen":
          return await this.wsHandler.listen(args);
        case "ws_close":
          return await this.wsHandler.close(args);
        case "ws_list_connections":
          return await this.wsHandler.listConnections();
        case "ws_ping":
          return await this.wsHandler.ping(args);
      }
    }

    // Code analysis operations
    if (
      name.startsWith("analyze_") ||
      name.startsWith("extract_") ||
      name.startsWith("count_") ||
      name.startsWith("detect_") ||
      name.startsWith("calculate_") ||
      name.startsWith("format_") ||
      name.startsWith("minify_")
    ) {
      switch (name) {
        case "analyze_javascript":
          return await this.codeHandler.analyzeJavaScript(args);
        case "extract_functions":
          return await this.codeHandler.extractFunctions(
            args.code,
            args.language
          );
        case "count_lines_of_code":
          return await this.codeHandler.countLinesOfCode(args);
        case "detect_code_smells":
          return await this.codeHandler.detectCodeSmells(args);
        case "extract_imports":
          return await this.codeHandler.extractImports(
            args.code,
            args.language
          );
        case "calculate_complexity":
          return await this.codeHandler.calculateComplexity(args);
      }
    }

    // Benchmark operations
    if (name.startsWith("benchmark_")) {
      switch (name) {
        case "benchmark_function":
          return await this.benchmarkHandler.benchmarkFunction(args);
        case "benchmark_comparison":
          return await this.benchmarkHandler.benchmarkComparison(args);
        case "benchmark_http_endpoint":
          return await this.benchmarkHandler.benchmarkHttpEndpoint(args);
        case "benchmark_file_operations":
          return await this.benchmarkHandler.benchmarkFileOperations(args);
        case "benchmark_sorting_algorithms":
          return await this.benchmarkHandler.benchmarkSortingAlgorithms(args);
        case "benchmark_memory_usage":
          return await this.benchmarkHandler.benchmarkMemoryUsage(args);
      }
    }

    // System-level utility operations
    switch (name) {
      case "cache_set":
        return await this.cacheSet(args);
      case "cache_get":
        return await this.cacheGet(args);
      case "cache_delete":
        return await this.cacheDelete(args);
      case "http_request":
        return await this.httpRequest(args);
      case "exec_command":
        return await this.execCommand(args);
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  // System utility method implementations

  private async cacheSet(args: { key: string; value: string; ttl?: number }) {
    this.cache.set(args.key, args.value, args.ttl);
    return { success: true, key: args.key };
  }

  private async cacheGet(args: { key: string }) {
    const value = this.cache.get(args.key);
    return { found: value !== null, key: args.key, value };
  }

  private async cacheDelete(args: { key: string }) {
    const existed = this.cache.has(args.key);
    this.cache.delete(args.key);
    return { success: true, key: args.key, existed };
  }

  private async httpRequest(args: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      args.timeout || 10000
    );

    try {
      const response = await fetch(args.url, {
        method: args.method || "GET",
        headers: args.headers,
        body: args.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async execCommand(args: {
    command: string;
    args?: string[];
    cwd?: string;
    timeout?: number;
  }) {
    const command = new Deno.Command(args.command, {
      args: args.args || [],
      cwd: args.cwd,
      stdout: "piped",
      stderr: "piped",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      args.timeout || 30000
    );

    try {
      const { code, stdout, stderr } = await command.output();
      clearTimeout(timeoutId);

      return {
        exitCode: code,
        stdout: new TextDecoder().decode(stdout),
        stderr: new TextDecoder().decode(stderr),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async start() {
    (globalThis as any).startTime = Date.now();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info("🚀 Advanced Modular MCP Server v3.0 is running!");
  }

  async cleanup() {
    this.stopMetricsCollection();
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
