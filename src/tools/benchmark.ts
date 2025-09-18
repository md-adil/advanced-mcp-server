import { BenchmarkResult } from "../types.ts";

export const benchmarkTools = [
  {
    name: "benchmark_function",
    description: "Benchmark a JavaScript function",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Function code to benchmark" },
        iterations: {
          type: "number",
          description: "Number of iterations",
          default: 1000,
        },
        warmup: {
          type: "number",
          description: "Number of warmup iterations",
          default: 100,
        },
        args: { type: "array", description: "Arguments to pass to function" },
      },
      required: ["code"],
    },
  },
  {
    name: "benchmark_comparison",
    description: "Compare performance of multiple functions",
    inputSchema: {
      type: "object",
      properties: {
        functions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              code: { type: "string" },
            },
            required: ["name", "code"],
          },
          description: "Functions to compare",
        },
        iterations: {
          type: "number",
          description: "Number of iterations per function",
          default: 1000,
        },
        args: { type: "array", description: "Arguments to pass to functions" },
      },
      required: ["functions"],
    },
  },
  {
    name: "benchmark_http_endpoint",
    description: "Benchmark HTTP endpoint performance",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to benchmark" },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          default: "GET",
        },
        requests: {
          type: "number",
          description: "Number of requests",
          default: 100,
        },
        concurrency: {
          type: "number",
          description: "Concurrent requests",
          default: 10,
        },
        headers: { type: "object", description: "Request headers" },
        body: { type: "string", description: "Request body for POST/PUT" },
      },
      required: ["url"],
    },
  },
  {
    name: "benchmark_file_operations",
    description: "Benchmark file I/O operations",
    inputSchema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["read", "write", "copy"],
          description: "Operation to benchmark",
        },
        filePath: { type: "string", description: "File path for operation" },
        fileSize: {
          type: "number",
          description: "File size in bytes for write operations",
          default: 1024,
        },
        iterations: {
          type: "number",
          description: "Number of iterations",
          default: 100,
        },
      },
      required: ["operation", "filePath"],
    },
  },
  {
    name: "benchmark_sorting_algorithms",
    description: "Benchmark different sorting algorithms",
    inputSchema: {
      type: "object",
      properties: {
        arraySize: {
          type: "number",
          description: "Size of array to sort",
          default: 1000,
        },
        dataType: {
          type: "string",
          enum: ["random", "sorted", "reversed", "duplicates"],
          default: "random",
        },
        algorithms: {
          type: "array",
          items: { type: "string" },
          description: "Algorithms to test",
          default: ["quicksort", "mergesort", "bubblesort", "native"],
        },
      },
    },
  },
  {
    name: "benchmark_memory_usage",
    description: "Monitor memory usage during operations",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Code to monitor" },
        duration: {
          type: "number",
          description: "Monitoring duration in seconds",
          default: 10,
        },
        interval: {
          type: "number",
          description: "Sampling interval in ms",
          default: 100,
        },
      },
      required: ["code"],
    },
  },
];

export class BenchmarkHandler {
  benchmarkFunction(args: {
    code: string;
    iterations?: number;
    warmup?: number;
    args?: unknown[];
  }): Promise<BenchmarkResult> {
    const iterations = args.iterations || 1000;
    const warmup = args.warmup || 100;
    const funcArgs = args.args || [];

    try {
      // Create function from code
      const func = new Function("...args", `return (${args.code})(...args)`);

      // Warmup
      for (let i = 0; i < warmup; i++) {
        func(...funcArgs);
      }

      // Force garbage collection if available
      if (typeof (globalThis as { gc?: () => void }).gc === "function") {
        (globalThis as { gc?: () => void }).gc?.();
      }

      const memoryBefore =
        (typeof performance !== "undefined" &&
          "memory" in performance &&
          (performance as Performance & { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize) ||
        0;
      const startTime = performance.now();

      // Run benchmark
      for (let i = 0; i < iterations; i++) {
        func(...funcArgs);
      }

      const endTime = performance.now();
      const memoryAfter =
        (typeof performance !== "undefined" &&
          "memory" in performance &&
          (performance as Performance & { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize) ||
        0;

      const duration = endTime - startTime;
      const opsPerSecond = Math.round((iterations / duration) * 1000);
      const memoryUsed = memoryAfter - memoryBefore;

      return Promise.resolve({
        name: "function_benchmark",
        duration,
        iterations,
        opsPerSecond,
        memoryUsed,
      });
    } catch (error) {
      throw new Error(`Benchmark failed: ${(error as Error).message}`);
    }
  }

  async benchmarkComparison(args: {
    functions: Array<{ name: string; code: string }>;
    iterations?: number;
    args?: unknown[];
  }) {
    const results: BenchmarkResult[] = [];
    const iterations = args.iterations || 1000;

    for (const funcDef of args.functions) {
      try {
        const result = await this.benchmarkFunction({
          code: funcDef.code,
          iterations,
          args: args.args ?? [],
        });

        results.push({
          ...result,
          name: funcDef.name,
        });
      } catch (_error) {
        results.push({
          name: funcDef.name,
          duration: -1,
          iterations: 0,
          opsPerSecond: 0,
          memoryUsed: 0,
        });
      }
    }

    // Sort by performance (ops per second)
    results.sort((a, b) => b.opsPerSecond - a.opsPerSecond);

    return {
      results,
      fastest: results[0]?.name,
      slowest: results[results.length - 1]?.name,
      comparison: results.map((r) => ({
        name: r.name,
        relativeSpeed: results[0]
          ? Math.round((r.opsPerSecond / results[0].opsPerSecond) * 100)
          : 0,
      })),
    };
  }

  async benchmarkHttpEndpoint(args: {
    url: string;
    method?: string;
    requests?: number;
    concurrency?: number;
    headers?: Record<string, string>;
    body?: string;
  }) {
    const { url, method = "GET", requests = 100, concurrency = 10 } = args;
    const results: Array<{ duration: number; status: number; size: number }> =
      [];
    const errors: Array<{ error: string; timestamp: string }> = [];

    const makeRequest = async (): Promise<{
      duration: number;
      status: number;
      size: number;
    }> => {
      const startTime = performance.now();

      try {
        const response = await fetch(url, {
          method,
          headers: new Headers(args.headers),
          body: args.body!,
        });

        const text = await response.text();
        const endTime = performance.now();

        return {
          duration: endTime - startTime,
          status: response.status,
          size: text.length,
        };
      } catch (error) {
        const endTime = performance.now();
        errors.push({
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        });

        return {
          duration: endTime - startTime,
          status: 0,
          size: 0,
        };
      }
    };

    const startTime = performance.now();

    // Run requests in batches for concurrency control
    for (let i = 0; i < requests; i += concurrency) {
      const batch = Math.min(concurrency, requests - i);
      const promises = Array(batch)
        .fill(0)
        .map(() => makeRequest());
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const successfulRequests = results.filter(
      (r) => r.status >= 200 && r.status < 400
    );
    const avgResponseTime =
      successfulRequests.length > 0
        ? successfulRequests.reduce((sum, r) => sum + r.duration, 0) /
          successfulRequests.length
        : 0;

    return {
      totalRequests: requests,
      successfulRequests: successfulRequests.length,
      failedRequests: requests - successfulRequests.length,
      totalDuration,
      avgResponseTime,
      minResponseTime: Math.min(...successfulRequests.map((r) => r.duration)),
      maxResponseTime: Math.max(...successfulRequests.map((r) => r.duration)),
      requestsPerSecond: Math.round(
        (successfulRequests.length / totalDuration) * 1000
      ),
      errors,
    };
  }

  async benchmarkFileOperations(args: {
    operation: string;
    filePath: string;
    fileSize?: number;
    iterations?: number;
  }) {
    const { operation, filePath, fileSize = 1024, iterations = 100 } = args;
    const results: number[] = [];

    // Generate test data
    const testData = "x".repeat(fileSize);
    const tempPath = `${filePath}.benchmark.tmp`;

    try {
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        switch (operation) {
          case "write":
            await Deno.writeTextFile(tempPath, testData);
            break;
          case "read":
            // Create file first if it doesn't exist
            try {
              await Deno.stat(tempPath);
            } catch {
              await Deno.writeTextFile(tempPath, testData);
            }
            await Deno.readTextFile(tempPath);
            break;
          case "copy":
            // Create source file first
            try {
              await Deno.stat(tempPath);
            } catch {
              await Deno.writeTextFile(tempPath, testData);
            }
            await Deno.copyFile(tempPath, `${tempPath}.copy`);
            break;
        }

        const endTime = performance.now();
        results.push(endTime - startTime);
      }

      const avgTime =
        results.reduce((sum, time) => sum + time, 0) / results.length;
      const minTime = Math.min(...results);
      const maxTime = Math.max(...results);

      return {
        operation,
        fileSize,
        iterations,
        avgTime,
        minTime,
        maxTime,
        opsPerSecond: Math.round(1000 / avgTime),
        throughput: Math.round((fileSize / avgTime) * 1000), // bytes per second
      };
    } finally {
      // Cleanup
      try {
        await Deno.remove(tempPath);
        await Deno.remove(`${tempPath}.copy`);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  async benchmarkSortingAlgorithms(args: {
    arraySize?: number;
    dataType?: string;
    algorithms?: string[];
  }) {
    const {
      arraySize = 1000,
      dataType = "random",
      algorithms = ["quicksort", "mergesort", "bubblesort", "native"],
    } = args;

    // Generate test data
    const generateArray = (size: number, type: string): number[] => {
      const arr: number[] = [];
      for (let i = 0; i < size; i++) {
        switch (type) {
          case "random":
            arr.push(Math.floor(Math.random() * size));
            break;
          case "sorted":
            arr.push(i);
            break;
          case "reversed":
            arr.push(size - i);
            break;
          case "duplicates":
            arr.push(Math.floor(Math.random() * 10));
            break;
        }
      }
      return arr;
    };

    const results: BenchmarkResult[] = [];

    for (const algorithm of algorithms) {
      const testArray = generateArray(arraySize, dataType);
      const startTime = performance.now();

      try {
        switch (algorithm) {
          case "native":
            testArray.sort((a, b) => a - b);
            break;
          case "quicksort":
            this.quicksort(testArray, 0, testArray.length - 1);
            break;
          case "mergesort":
            this.mergesort(testArray);
            break;
          case "bubblesort":
            this.bubblesort(testArray);
            break;
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        results.push({
          name: algorithm,
          duration,
          iterations: 1,
          opsPerSecond: Math.round(1000 / duration),
          memoryUsed: arraySize * 8, // Approximate memory for number array
        });
      } catch (error) {
        results.push({
          name: algorithm,
          duration: -1,
          iterations: 0,
          opsPerSecond: 0,
          memoryUsed: 0,
        });
      }
    }

    results.sort((a, b) => a.duration - b.duration);

    return {
      arraySize,
      dataType,
      results,
      fastest: results[0]?.name,
      slowest: results[results.length - 1]?.name,
    };
  }

  async benchmarkMemoryUsage(args: {
    code: string;
    duration?: number;
    interval?: number;
  }) {
    const { code, duration = 10, interval = 100 } = args;
    const samples: Array<{
      timestamp: string;
      heapUsed: number;
      heapTotal: number;
    }> = [];

    try {
      const func = new Function(code);
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      // Start the function
      const promise = Promise.resolve(func());

      // Monitor memory usage
      const monitor = setInterval(() => {
        if (Date.now() >= endTime) {
          clearInterval(monitor);
          return;
        }

        const memory = (performance as any).memory;
        if (memory) {
          samples.push({
            timestamp: new Date().toISOString(),
            heapUsed: memory.usedJSHeapSize,
            heapTotal: memory.totalJSHeapSize,
          });
        }
      }, interval);

      // Wait for completion or timeout
      await Promise.race([
        promise,
        new Promise((resolve) => setTimeout(resolve, duration * 1000)),
      ]);

      clearInterval(monitor);

      const maxHeapUsed = Math.max(...samples.map((s) => s.heapUsed));
      const minHeapUsed = Math.min(...samples.map((s) => s.heapUsed));
      const avgHeapUsed =
        samples.reduce((sum, s) => sum + s.heapUsed, 0) / samples.length;

      return {
        samples: samples.slice(-50), // Return last 50 samples
        maxHeapUsed,
        minHeapUsed,
        avgHeapUsed,
        memoryGrowth: maxHeapUsed - minHeapUsed,
        duration: duration * 1000,
        sampleCount: samples.length,
      };
    } catch (error) {
      throw new Error(`Memory monitoring failed: ${(error as Error).message}`);
    }
  }

  // Sorting algorithm implementations
  private quicksort(arr: number[], low: number, high: number): void {
    if (low < high) {
      const pi = this.partition(arr, low, high);
      this.quicksort(arr, low, pi - 1);
      this.quicksort(arr, pi + 1, high);
    }
  }

  private partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (arr[j]! < pivot!) {
        i++;
        [(arr as any)[i], (arr as any)[j]] = [arr[j], arr[i]];
      }
    }
    [(arr as any)[i + 1], (arr as any)[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }

  private mergesort(arr: number[]): number[] {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = this.mergesort(arr.slice(0, mid));
    const right = this.mergesort(arr.slice(mid));

    return this.merge(left, right);
  }

  private merge(left: number[], right: number[]): number[] {
    const result: number[] = [];
    let i = 0,
      j = 0;

    while (i < left.length && j < right.length) {
      if (left[i]! <= right[j]!) {
        result.push(left[i++]!);
      } else {
        result.push(right[j++]!);
      }
    }

    return result.concat(left.slice(i)).concat(right.slice(j));
  }

  private bubblesort(arr: number[]): void {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (arr[j]! > arr[j + 1]!) {
          [(arr as any)[j], (arr as any)[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
  }
}
