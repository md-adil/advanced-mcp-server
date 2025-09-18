import { ToolResult } from "../../types/tool-response.ts";

interface ElasticResponse {
  [key: string]: unknown;
}

interface ElasticConfig {
  host: string;
  kibana_host: string;
  username?: string | undefined;
  password?: string | undefined;
  api_key?: string | undefined;
}

// Configuration factory function
function createElasticConfig(): ElasticConfig {
  return {
    host: Deno.env.get("ELASTIC_HOST") || "http://localhost:9200",
    kibana_host: Deno.env.get("KIBANA_HOST") || "http://localhost:5601",
    username: Deno.env.get("ELASTIC_USERNAME"),
    password: Deno.env.get("ELASTIC_PASSWORD"),
    api_key: Deno.env.get("ELASTIC_API_KEY"),
  };
}

// Authentication headers factory
function getAuthHeaders(config: ElasticConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.api_key) {
    headers["Authorization"] = `ApiKey ${config.api_key}`;
  } else if (config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`);
    headers["Authorization"] = `Basic ${credentials}`;
  }

  return headers;
}

// HTTP request utility
async function makeRequest(
  url: string,
  config: ElasticConfig,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<ElasticResponse> {
  const requestOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...getAuthHeaders(config),
      ...options.headers,
    },
  };

  if (options.body) {
    requestOptions.body = options.body;
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json() as ElasticResponse;
}

// Time range utilities
function parseTimeRange(timeRange: string): number {
  const match = timeRange.match(/^(\d+)([mhd])$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid time range format. Use formats like '15m', '1h', '1d'");
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error("Invalid time unit");
  }
}

function getTimeRangeFilter(timeRange: string) {
  const now = new Date();
  const range = parseTimeRange(timeRange);
  const fromTime = new Date(now.getTime() - range);

  return {
    range: {
      "@timestamp": {
        gte: fromTime.toISOString(),
        lte: now.toISOString(),
      },
    },
  };
}

// Safe property access utility
function safeGet(obj: unknown, path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

// Individual tool functions
async function getDashboards(config: ElasticConfig, args: {
  kibana_host?: string;
  index?: string;
}): Promise<ToolResult> {
  const kibanaHost = args.kibana_host || config.kibana_host;

  try {
    const response = await makeRequest(`${kibanaHost}/api/saved_objects/_find`, config, {
      method: "POST",
      body: JSON.stringify({
        type: "dashboard",
        search_fields: ["title"],
        fields: ["title", "description"],
      }),
    });

    const savedObjects = safeGet(response, ["saved_objects"]) as Array<Record<string, unknown>>;
    const dashboards = savedObjects?.map((obj: Record<string, unknown>) => ({
      id: obj["id"],
      title: safeGet(obj, ["attributes", "title"]),
      description: safeGet(obj, ["attributes", "description"]),
      url: `${kibanaHost}/app/dashboards#/view/${obj["id"]}`,
    })) || [];

    return {
      success: true,
      dashboards,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function getMetrics(config: ElasticConfig, args: {
  host?: string;
  service_name?: string;
  time_range?: string;
  environment?: string;
}): Promise<ToolResult> {
  const host = args.host || config.host;
  const timeRange = args.time_range || "15m";

  const query = {
    size: 0,
    query: {
      bool: {
        must: [
          getTimeRangeFilter(timeRange),
          { term: { "processor.event": "metric" } },
        ],
      },
    },
    aggs: {
      services: {
        terms: {
          field: "service.name",
          size: 100,
        },
        aggs: {
          avg_response_time: {
            avg: {
              field: "transaction.duration.us",
            },
          },
          throughput: {
            value_count: {
              field: "transaction.name",
            },
          },
          error_rate: {
            filter: {
              term: { "event.outcome": "failure" },
            },
          },
        },
      },
    },
  };

  if (args.service_name) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "service.name": args.service_name },
    });
  }

  if (args.environment) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "service.environment": args.environment },
    });
  }

  try {
    const response = await makeRequest(`${host}/apm-*/_search`, config, {
      method: "POST",
      body: JSON.stringify(query),
    });

    const buckets = safeGet(response, ["aggregations", "services", "buckets"]) as Array<Record<string, unknown>>;
    const metrics = buckets?.map((bucket: Record<string, unknown>) => ({
      service_name: bucket["key"],
      avg_response_time_ms: safeGet(bucket, ["avg_response_time", "value"]) ?
        Number(safeGet(bucket, ["avg_response_time", "value"])) / 1000 : 0,
      throughput: safeGet(bucket, ["throughput", "value"]),
      error_count: safeGet(bucket, ["error_rate", "doc_count"]),
      doc_count: bucket["doc_count"],
    })) || [];

    return {
      success: true,
      metrics,
      time_range: timeRange,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function getLogs(config: ElasticConfig, args: {
  host?: string;
  index?: string;
  service_name?: string;
  log_level?: string;
  time_range?: string;
  size?: number;
}): Promise<ToolResult> {
  const host = args.host || config.host;
  const index = args.index || "logs-*";
  const timeRange = args.time_range || "15m";
  const size = args.size || 100;

  const query = {
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [getTimeRangeFilter(timeRange)],
      },
    },
  };

  if (args.service_name) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "service.name": args.service_name },
    });
  }

  if (args.log_level) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "log.level": args.log_level },
    });
  }

  try {
    const response = await makeRequest(`${host}/${index}/_search`, config, {
      method: "POST",
      body: JSON.stringify(query),
    });

    const hitsArray = safeGet(response, ["hits", "hits"]) as Array<Record<string, unknown>>;
    const logs = hitsArray?.map((hit: Record<string, unknown>) => {
      const source = hit["_source"] as Record<string, unknown>;
      return {
        timestamp: source?.["@timestamp"],
        level: safeGet(source, ["log", "level"]),
        message: source?.["message"] || safeGet(source, ["log", "message"]),
        service: safeGet(source, ["service", "name"]),
        host: safeGet(source, ["host", "name"]),
        source: source,
      };
    }) || [];

    return {
      success: true,
      logs,
      total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
      time_range: timeRange,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function getTraces(config: ElasticConfig, args: {
  host?: string;
  service_name?: string;
  trace_id?: string;
  transaction_name?: string;
  time_range?: string;
  size?: number;
}): Promise<ToolResult> {
  const host = args.host || config.host;
  const timeRange = args.time_range || "15m";
  const size = args.size || 50;

  const query = {
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          getTimeRangeFilter(timeRange),
          { term: { "processor.event": "transaction" } },
        ],
      },
    },
  };

  if (args.service_name) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "service.name": args.service_name },
    });
  }

  if (args.trace_id) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "trace.id": args.trace_id },
    });
  }

  if (args.transaction_name) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "transaction.name": args.transaction_name },
    });
  }

  try {
    const response = await makeRequest(`${host}/apm-*/_search`, config, {
      method: "POST",
      body: JSON.stringify(query),
    });

    const hitsArray = safeGet(response, ["hits", "hits"]) as Array<Record<string, unknown>>;
    const traces = hitsArray?.map((hit: Record<string, unknown>) => {
      const source = hit["_source"] as Record<string, unknown>;
      return {
        trace_id: safeGet(source, ["trace", "id"]),
        transaction_id: safeGet(source, ["transaction", "id"]),
        transaction_name: safeGet(source, ["transaction", "name"]),
        service_name: safeGet(source, ["service", "name"]),
        duration_ms: safeGet(source, ["transaction", "duration", "us"]) ?
          Number(safeGet(source, ["transaction", "duration", "us"])) / 1000 : 0,
        timestamp: source?.["@timestamp"],
        outcome: safeGet(source, ["event", "outcome"]),
        type: safeGet(source, ["transaction", "type"]),
      };
    }) || [];

    return {
      success: true,
      traces,
      total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
      time_range: timeRange,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function getErrors(config: ElasticConfig, args: {
  host?: string;
  service_name?: string;
  error_type?: string;
  time_range?: string;
  size?: number;
}): Promise<ToolResult> {
  const host = args.host || config.host;
  const timeRange = args.time_range || "15m";
  const size = args.size || 50;

  const query = {
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          getTimeRangeFilter(timeRange),
          { term: { "processor.event": "error" } },
        ],
      },
    },
  };

  if (args.service_name) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "service.name": args.service_name },
    });
  }

  if (args.error_type) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "error.exception.type": args.error_type },
    });
  }

  try {
    const response = await makeRequest(`${host}/apm-*/_search`, config, {
      method: "POST",
      body: JSON.stringify(query),
    });

    const hitsArray = safeGet(response, ["hits", "hits"]) as Array<Record<string, unknown>>;
    const errors = hitsArray?.map((hit: Record<string, unknown>) => {
      const source = hit["_source"] as Record<string, unknown>;
      return {
        error_id: safeGet(source, ["error", "id"]),
        service_name: safeGet(source, ["service", "name"]),
        error_type: safeGet(source, ["error", "exception", "type"]),
        error_message: safeGet(source, ["error", "exception", "message"]),
        stack_trace: safeGet(source, ["error", "exception", "stacktrace"]),
        timestamp: source?.["@timestamp"],
        trace_id: safeGet(source, ["trace", "id"]),
        transaction_id: safeGet(source, ["transaction", "id"]),
      };
    }) || [];

    return {
      success: true,
      errors,
      total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
      time_range: timeRange,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function getServices(config: ElasticConfig, args: {
  host?: string;
  environment?: string;
  time_range?: string;
}): Promise<ToolResult> {
  const host = args.host || config.host;
  const timeRange = args.time_range || "15m";

  const query = {
    size: 0,
    query: {
      bool: {
        must: [getTimeRangeFilter(timeRange)],
      },
    },
    aggs: {
      services: {
        terms: {
          field: "service.name",
          size: 100,
        },
        aggs: {
          environments: {
            terms: {
              field: "service.environment",
              size: 10,
            },
          },
          languages: {
            terms: {
              field: "service.language.name",
              size: 10,
            },
          },
          versions: {
            terms: {
              field: "service.version",
              size: 10,
            },
          },
        },
      },
    },
  };

  if (args.environment) {
    (query.query.bool.must as Array<unknown>).push({
      term: { "service.environment": args.environment },
    });
  }

  try {
    const response = await makeRequest(`${host}/apm-*/_search`, config, {
      method: "POST",
      body: JSON.stringify(query),
    });

    const buckets = safeGet(response, ["aggregations", "services", "buckets"]) as Array<Record<string, unknown>>;
    const services = buckets?.map((bucket: Record<string, unknown>) => ({
      name: bucket["key"],
      doc_count: bucket["doc_count"],
      environments: (safeGet(bucket, ["environments", "buckets"]) as Array<Record<string, unknown>>)?.map((env: Record<string, unknown>) => env["key"]) || [],
      languages: (safeGet(bucket, ["languages", "buckets"]) as Array<Record<string, unknown>>)?.map((lang: Record<string, unknown>) => lang["key"]) || [],
      versions: (safeGet(bucket, ["versions", "buckets"]) as Array<Record<string, unknown>>)?.map((ver: Record<string, unknown>) => ver["key"]) || [],
    })) || [];

    return {
      success: true,
      services,
      time_range: timeRange,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function searchLogs(config: ElasticConfig, args: {
  host?: string;
  index?: string;
  query: string;
  time_range?: string;
  size?: number;
}): Promise<ToolResult> {
  const host = args.host || config.host;
  const index = args.index || "logs-*";
  const timeRange = args.time_range || "15m";
  const size = args.size || 100;

  const searchQuery = {
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          getTimeRangeFilter(timeRange),
          {
            query_string: {
              query: args.query,
            },
          },
        ],
      },
    },
  };

  try {
    const response = await makeRequest(`${host}/${index}/_search`, config, {
      method: "POST",
      body: JSON.stringify(searchQuery),
    });

    const hitsArray = safeGet(response, ["hits", "hits"]) as Array<Record<string, unknown>>;
    const results = hitsArray?.map((hit: Record<string, unknown>) => ({
      timestamp: safeGet(hit, ["_source", "@timestamp"]),
      score: hit["_score"],
      source: hit["_source"],
      highlights: hit["highlight"],
    })) || [];

    return {
      success: true,
      results,
      total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
      query: args.query,
      time_range: timeRange,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

async function healthCheck(config: ElasticConfig, args: { host?: string }): Promise<ToolResult> {
  const host = args.host || config.host;

  try {
    const health = await makeRequest(`${host}/_cluster/health`, config);
    const info = await makeRequest(`${host}/`, config);

    return {
      success: true,
      cluster_health: {
        status: health["status"],
        cluster_name: health["cluster_name"],
        number_of_nodes: health["number_of_nodes"],
        number_of_data_nodes: health["number_of_data_nodes"],
        active_primary_shards: health["active_primary_shards"],
        active_shards: health["active_shards"],
        relocating_shards: health["relocating_shards"],
        initializing_shards: health["initializing_shards"],
        unassigned_shards: health["unassigned_shards"],
      },
      elasticsearch_info: {
        name: info["name"],
        version: safeGet(info, ["version", "number"]),
        lucene_version: safeGet(info, ["version", "lucene_version"]),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Main execution function - handles all elastic tool cases
export async function executeElasticTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const config = createElasticConfig();

  switch (name) {
    case "elastic_get_dashboards":
      return await getDashboards(config, args);
    case "elastic_get_metrics":
      return await getMetrics(config, args);
    case "elastic_get_logs":
      return await getLogs(config, args);
    case "elastic_get_traces":
      return await getTraces(config, args);
    case "elastic_get_errors":
      return await getErrors(config, args);
    case "elastic_get_services":
      return await getServices(config, args);
    case "elastic_search_logs":
      return await searchLogs(config, args as { host?: string; index?: string; query: string; time_range?: string; size?: number; });
    case "elastic_health_check":
      return await healthCheck(config, args);
    default:
      throw new Error(`Unknown elastic tool: ${name}`);
  }
}