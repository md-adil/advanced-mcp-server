import { createElasticConfig, ElasticConfig } from "./config.ts";
import { getAuthHeaders } from "./credentials.ts";

// Types and interfaces
interface ElasticResponse {
  [key: string]: unknown;
}

type Result = Record<string, unknown>;

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

  return (await response.json()) as ElasticResponse;
}

// Time range utilities
function parseTimeRange(timeRange: string): number {
  const match = timeRange.match(/^(\d+)([mhd])$/);
  if (!match?.[1] || !match?.[2]) {
    throw new Error(
      "Invalid time range format. Use formats like '15m', '1h', '1d'"
    );
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const multiplier = multipliers[unit as keyof typeof multipliers];

  if (!multiplier) {
    throw new Error("Invalid time unit");
  }

  return value * multiplier;
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

// Utility functions
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

// Common query building functions
function buildBaseQuery(timeRange: string, additionalFilters: unknown[] = []) {
  return {
    query: {
      bool: {
        must: [getTimeRangeFilter(timeRange), ...additionalFilters],
      },
    },
  };
}

function buildSearchQuery(
  timeRange: string,
  size: number,
  additionalFilters: unknown[] = []
) {
  return {
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    ...buildBaseQuery(timeRange, additionalFilters),
  };
}

function addOptionalTermFilter(
  filters: unknown[],
  field: string,
  value?: string
) {
  if (value) {
    filters.push({ term: { [field]: value } });
  }
}

// Execution wrapper for consistent error handling

async function executeElasticRequest(
  config: ElasticConfig,
  endpoint: string,
  method: string = "POST",
  body?: unknown
): Promise<ElasticResponse> {
  const requestOptions: { method: string; body?: string } = { method };
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }
  return await makeRequest(`${config.host}${endpoint}`, config, requestOptions);
}

// Individual tool functions
export async function getDashboards(): Promise<Result> {
  const config = createElasticConfig();
  const response = await makeRequest(
    `${config.kibana_host}/api/saved_objects/_find`,
    config,
    {
      method: "POST",
      body: JSON.stringify({
        type: "dashboard",
        search_fields: ["title"],
        fields: ["title", "description"],
      }),
    }
  );

  const savedObjects = safeGet(response, ["saved_objects"]) as Array<
    Record<string, unknown>
  >;
  const dashboards =
    savedObjects?.map((obj: Record<string, unknown>) => ({
      id: obj["id"],
      title: safeGet(obj, ["attributes", "title"]),
      description: safeGet(obj, ["attributes", "description"]),
      url: `${config.kibana_host}/app/dashboards#/view/${obj["id"]}`,
    })) || [];

  return { dashboards };
}

export async function getMetrics(args: {
  host?: string | undefined;
  service_name?: string | undefined;
  time_range?: string | undefined;
  environment?: string | undefined;
}): Promise<Result> {
  const config = createElasticConfig();

  const timeRange = args.time_range || "15m";
  const filters = [{ term: { "processor.event": "metric" } }];
  addOptionalTermFilter(filters, "service.name", args.service_name);
  addOptionalTermFilter(filters, "service.environment", args.environment);

  const query = {
    size: 0,
    ...buildBaseQuery(timeRange, filters),
    aggs: {
      services: {
        terms: { field: "service.name", size: 100 },
        aggs: {
          avg_response_time: { avg: { field: "transaction.duration.us" } },
          throughput: { value_count: { field: "transaction.name" } },
          error_rate: { filter: { term: { "event.outcome": "failure" } } },
        },
      },
    },
  };

  const response = await executeElasticRequest(
    config,
    "/apm-*/_search",
    "POST",
    query
  );

  const buckets = safeGet(response, [
    "aggregations",
    "services",
    "buckets",
  ]) as Array<Record<string, unknown>>;
  const metrics =
    buckets?.map((bucket: Record<string, unknown>) => ({
      service_name: bucket["key"],
      avg_response_time_ms: safeGet(bucket, ["avg_response_time", "value"])
        ? Number(safeGet(bucket, ["avg_response_time", "value"])) / 1000
        : 0,
      throughput: safeGet(bucket, ["throughput", "value"]),
      error_count: safeGet(bucket, ["error_rate", "doc_count"]),
      doc_count: bucket["doc_count"],
    })) || [];

  return { metrics, time_range: timeRange };
}

export async function getLogs(args: {
  host?: string | undefined;
  index?: string | undefined;
  service_name?: string | undefined;
  log_level?: string | undefined;
  time_range?: string | undefined;
  size?: number | undefined;
}): Promise<Result> {
  const config = createElasticConfig();

  const index = args.index || "logs-*";
  const timeRange = args.time_range || "15m";
  const size = args.size || 100;

  const filters: unknown[] = [];
  addOptionalTermFilter(filters, "service.name", args.service_name);
  addOptionalTermFilter(filters, "log.level", args.log_level);

  const query = buildSearchQuery(timeRange, size, filters);

  const response = await executeElasticRequest(
    config,
    `/${index}/_search`,
    "POST",
    query
  );

  const hitsArray = safeGet(response, ["hits", "hits"]) as Array<
    Record<string, unknown>
  >;
  const logs =
    hitsArray?.map((hit: Record<string, unknown>) => {
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
    logs,
    total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
    time_range: timeRange,
  };
}

export async function getTraces(args: {
  host?: string | undefined;
  service_name?: string | undefined;
  trace_id?: string | undefined;
  transaction_name?: string | undefined;
  time_range?: string | undefined;
  size?: number | undefined;
}): Promise<Result> {
  const config = createElasticConfig();

  const timeRange = args.time_range || "15m";
  const size = args.size || 50;

  const filters = [{ term: { "processor.event": "transaction" } }];
  addOptionalTermFilter(filters, "service.name", args.service_name);
  addOptionalTermFilter(filters, "trace.id", args.trace_id);
  addOptionalTermFilter(filters, "transaction.name", args.transaction_name);

  const query = buildSearchQuery(timeRange, size, filters);

  const response = await executeElasticRequest(
    config,
    "/apm-*/_search",
    "POST",
    query
  );

  const hitsArray = safeGet(response, ["hits", "hits"]) as Array<
    Record<string, unknown>
  >;
  const traces =
    hitsArray?.map((hit: Record<string, unknown>) => {
      const source = hit["_source"] as Record<string, unknown>;
      return {
        trace_id: safeGet(source, ["trace", "id"]),
        transaction_id: safeGet(source, ["transaction", "id"]),
        transaction_name: safeGet(source, ["transaction", "name"]),
        service_name: safeGet(source, ["service", "name"]),
        duration_ms: safeGet(source, ["transaction", "duration", "us"])
          ? Number(safeGet(source, ["transaction", "duration", "us"])) / 1000
          : 0,
        timestamp: source?.["@timestamp"],
        outcome: safeGet(source, ["event", "outcome"]),
        type: safeGet(source, ["transaction", "type"]),
      };
    }) || [];

  return {
    traces,
    total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
    time_range: timeRange,
  };
}

export async function getErrors(args: {
  host?: string | undefined;
  service_name?: string | undefined;
  error_type?: string | undefined;
  time_range?: string | undefined;
  size?: number | undefined;
}): Promise<Result> {
  const config = createElasticConfig();

  const timeRange = args.time_range || "15m";
  const size = args.size || 50;

  const filters = [{ term: { "processor.event": "error" } }];
  addOptionalTermFilter(filters, "service.name", args.service_name);
  addOptionalTermFilter(filters, "error.exception.type", args.error_type);

  const query = buildSearchQuery(timeRange, size, filters);

  const response = await executeElasticRequest(
    config,
    "/apm-*/_search",
    "POST",
    query
  );

  const hitsArray = safeGet(response, ["hits", "hits"]) as Array<
    Record<string, unknown>
  >;
  const errors =
    hitsArray?.map((hit: Record<string, unknown>) => {
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
    errors,
    total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
    time_range: timeRange,
  };
}

export async function getServices(args: {
  host?: string | undefined;
  environment?: string | undefined;
  time_range?: string | undefined;
}): Promise<Result> {
  const config = createElasticConfig();

  const timeRange = args.time_range || "15m";

  const filters: unknown[] = [];
  addOptionalTermFilter(filters, "service.environment", args.environment);

  const query = {
    size: 0,
    ...buildBaseQuery(timeRange, filters),
    aggs: {
      services: {
        terms: { field: "service.name", size: 100 },
        aggs: {
          environments: { terms: { field: "service.environment", size: 10 } },
          languages: { terms: { field: "service.language.name", size: 10 } },
          versions: { terms: { field: "service.version", size: 10 } },
        },
      },
    },
  };

  const response = await executeElasticRequest(
    config,
    "/apm-*/_search",
    "POST",
    query
  );

  const buckets = safeGet(response, [
    "aggregations",
    "services",
    "buckets",
  ]) as Array<Record<string, unknown>>;
  const services =
    buckets?.map((bucket: Record<string, unknown>) => ({
      name: bucket["key"],
      doc_count: bucket["doc_count"],
      environments:
        (
          safeGet(bucket, ["environments", "buckets"]) as Array<
            Record<string, unknown>
          >
        )?.map((env: Record<string, unknown>) => env["key"]) || [],
      languages:
        (
          safeGet(bucket, ["languages", "buckets"]) as Array<
            Record<string, unknown>
          >
        )?.map((lang: Record<string, unknown>) => lang["key"]) || [],
      versions:
        (
          safeGet(bucket, ["versions", "buckets"]) as Array<
            Record<string, unknown>
          >
        )?.map((ver: Record<string, unknown>) => ver["key"]) || [],
    })) || [];

  return { services, time_range: timeRange };
}

export async function searchLogs(args: {
  host?: string | undefined;
  index?: string | undefined;
  query: string;
  time_range?: string | undefined;
  size?: number | undefined;
}): Promise<Result> {
  const config = createElasticConfig();

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
          { query_string: { query: args.query } },
        ],
      },
    },
  };

  const response = await executeElasticRequest(
    config,
    `/${index}/_search`,
    "POST",
    searchQuery
  );

  const hitsArray = safeGet(response, ["hits", "hits"]) as Array<
    Record<string, unknown>
  >;
  const results =
    hitsArray?.map((hit: Record<string, unknown>) => ({
      timestamp: safeGet(hit, ["_source", "@timestamp"]),
      score: hit["_score"],
      source: hit["_source"],
      highlights: hit["highlight"],
    })) || [];

  return {
    results,
    total: Number(safeGet(response, ["hits", "total", "value"])) || 0,
    query: args.query,
    time_range: timeRange,
  };
}

export async function healthCheck(): Promise<Result> {
  const config = createElasticConfig();

  const [health, info] = await Promise.all([
    executeElasticRequest(config, "/_cluster/health", "GET"),
    executeElasticRequest(config, "/", "GET"),
  ]);

  return {
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
}

export async function executeRawQuery(args: {
  path: string;
  method?: string | undefined;
  body?: string | undefined;
}): Promise<Result> {
  const config = createElasticConfig();
  const method = args.method || "GET";
  const path = args.path.startsWith("/") ? args.path : `/${args.path}`;
  let parsedBody: Record<string, unknown> | undefined;
  if (args.body) {
    parsedBody = JSON.parse(args.body);
  }

  const response = await executeElasticRequest(
    config,
    path,
    method.toUpperCase(),
    parsedBody
  );

  return {
    method: method.toUpperCase(),
    path,
    body: parsedBody,
    response,
  };
}
