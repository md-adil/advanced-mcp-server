import { LogEntry } from "../types.ts";

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number;

  constructor(maxLogs = 1000) {
    this.maxLogs = maxLogs;
  }

  log(level: LogEntry["level"], message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogs / 2));
    }

    console.error(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log("error", message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}