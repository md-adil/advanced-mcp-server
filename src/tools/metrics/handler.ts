import { SystemMetrics } from "../../types.ts";
import { Logger } from "../../utils/logger.ts";

export class MetricsCollector {
  private metrics: SystemMetrics[] = [];
  private metricsInterval?: number | undefined;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async getCurrentMetrics(): Promise<SystemMetrics> {
    return {
      timestamp: new Date().toISOString(),
      cpu: await this.getCpuUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
    };
  }

  getMetricsHistory(limit?: number): SystemMetrics[] {
    const actualLimit = limit || 10;
    return this.metrics.slice(-actualLimit);
  }

  startCollection(interval: number = 30000) {
    this.stopCollection();

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getCurrentMetrics();
        this.metrics.push(metrics);

        // Keep only last 100 entries, trim to 50 when exceeded
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-50);
        }
      } catch (error) {
        this.logger.error("Failed to collect metrics", {
          error: (error as Error).message,
        });
      }
    }, interval);

    return { success: true, interval };
  }

  stopCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
      return { success: true, message: "Metrics collection stopped" };
    }
    return { success: false, message: "Metrics collection was not running" };
  }

  clearHistory() {
    const count = this.metrics.length;
    this.metrics = [];
    return { success: true, clearedCount: count };
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
}

// Functional interface for tool execution
export function executeMetricsTool(collector: MetricsCollector, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "metrics_current":
      return collector.getCurrentMetrics();
    case "metrics_history":
      return collector.getMetricsHistory((args as { limit?: number }).limit);
    case "metrics_start_collection":
      return collector.startCollection((args as { interval?: number }).interval);
    case "metrics_stop_collection":
      return collector.stopCollection();
    case "metrics_clear_history":
      return collector.clearHistory();
    default:
      throw new Error(`Unknown metrics tool: ${name}`);
  }
}