export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: Record<string, unknown>;
}

export interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
}

export interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}

export interface FileInfo {
  name: string;
  type: "file" | "directory";
  size: number;
  modified?: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface PerformanceMetric {
  timestamp: string;
  cpu: number;
  memory: number;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  tools: string[];
  resources: string[];
  dependencies?: string[];
}

export interface GitStatus {
  branch: string;
  changes: {
    staged: string[];
    unstaged: string[];
    untracked: string[];
  };
  commits: {
    ahead: number;
    behind: number;
  };
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  created: string;
}

export interface ImageAnalysis {
  width: number;
  height: number;
  format: string;
  size: number;
  colors: string[];
  objects?: string[];
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export interface ASTNode {
  type: string;
  name?: string;
  start: number;
  end: number;
  children?: ASTNode[];
}

export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  opsPerSecond: number;
  memoryUsed: number;
}