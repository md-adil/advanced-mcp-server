import { ElasticConfig } from "./config.ts";

export function getAuthHeaders(config: ElasticConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const credentials = btoa(`${config.username}:${config.password}`);
  headers["Authorization"] = `Basic ${credentials}`;
  return headers;
}
