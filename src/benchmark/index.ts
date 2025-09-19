// Re-export from the main benchmark file for now
export { benchmarkTools } from "./benchmark.ts";
import { ToolResult } from "../../types/tool-response.ts";

// Function wrapper for the existing class-based handler
export async function executeBenchmarkTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // This is a simplified wrapper - in produc./benchmark.tst to refactor to pure functions
  const { BenchmarkHandler } = await import("../benchmark.ts");
  const handler = new BenchmarkHandler();

  switch (name) {
    case "benchmark_function":
      return await handler.benchmarkFunction(
        args as { code: string; iterations?: number; warmup?: number }
      );
    case "benchmark_comparison":
      return await handler.benchmarkComparison(
        args as {
          functions: Array<{ name: string; code: string }>;
          iterations?: number;
        }
      );
    case "benchmark_http_endpoint":
      return await handler.benchmarkHttpEndpoint(
        args as {
          url: string;
          method?: string;
          concurrent?: number;
          duration?: number;
        }
      );
    case "benchmark_file_operations":
      return await handler.benchmarkFileOperations({
        operation: (args as any).operation,
        filePath: (args as any).path || "./test.tmp",
        fileSize: (args as any).size,
        iterations: (args as any).iterations,
      });
    case "benchmark_sorting_algorithms":
      return await handler.benchmarkSortingAlgorithms(
        args as { size?: number; algorithms?: string[] }
      );
    case "benchmark_memory_usage":
      return await handler.benchmarkMemoryUsage(
        args as { code: string; iterations?: number }
      );
    default:
      throw new Error(`Unknown benchmark tool: ${name}`);
  }
}
