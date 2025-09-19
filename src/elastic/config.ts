import { error } from "../utils/error.ts";

export interface ElasticConfig {
  host: string;
  kibana_host?: string | undefined;
  username: string;
  password: string;
}
export function createElasticConfig(): ElasticConfig {
  return {
    host: Deno.env.get("ELASTIC_HOST") ?? error("ELASTIC_HOST is defined"),
    kibana_host: Deno.env.get("KIBANA_HOST"),
    username:
      Deno.env.get("ELASTIC_USERNAME") ??
      error("ELASTIC_USERNAME is not defined"),
    password:
      Deno.env.get("ELASTIC_PASSWORD") ??
      error("ELASTIC_PASSWORD is not defined"),
  };
}
