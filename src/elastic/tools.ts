export const elasticTools = [
  {
    name: "elastic_get_dashboards",
    description: "Get Elastic APM dashboards",
    inputSchema: {
      type: "object",
      properties: {
        kibana_host: {
          type: "string",
          description: "Kibana host URL (overrides env KIBANA_HOST)",
        },
        index: {
          type: "string",
          description: "APM index pattern",
          default: "apm-*",
        },
      },
    },
  },
  {
    name: "elastic_get_metrics",
    description: "Get APM metrics for services",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
        service_name: {
          type: "string",
          description: "Service name to filter metrics",
        },
        time_range: {
          type: "string",
          description: "Time range (e.g., '15m', '1h', '1d')",
          default: "15m",
        },
        environment: {
          type: "string",
          description: "Environment filter",
        },
      },
    },
  },
  {
    name: "elastic_get_logs",
    description: "Get application logs from Elastic",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
        index: {
          type: "string",
          description: "Log index pattern",
          default: "logs-*",
        },
        service_name: {
          type: "string",
          description: "Service name to filter logs",
        },
        log_level: {
          type: "string",
          enum: ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"],
          description: "Log level filter",
        },
        time_range: {
          type: "string",
          description: "Time range (e.g., '15m', '1h', '1d')",
          default: "15m",
        },
        size: {
          type: "number",
          description: "Number of log entries to return",
          default: 100,
        },
      },
    },
  },
  {
    name: "elastic_get_traces",
    description: "Get APM traces and spans",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
        service_name: {
          type: "string",
          description: "Service name to filter traces",
        },
        trace_id: {
          type: "string",
          description: "Specific trace ID",
        },
        transaction_name: {
          type: "string",
          description: "Transaction name filter",
        },
        time_range: {
          type: "string",
          description: "Time range (e.g., '15m', '1h', '1d')",
          default: "15m",
        },
        size: {
          type: "number",
          description: "Number of traces to return",
          default: 50,
        },
      },
    },
  },
  {
    name: "elastic_get_errors",
    description: "Get APM error data",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
        service_name: {
          type: "string",
          description: "Service name to filter errors",
        },
        error_type: {
          type: "string",
          description: "Error type or exception class",
        },
        time_range: {
          type: "string",
          description: "Time range (e.g., '15m', '1h', '1d')",
          default: "15m",
        },
        size: {
          type: "number",
          description: "Number of errors to return",
          default: 50,
        },
      },
    },
  },
  {
    name: "elastic_get_services",
    description: "Get list of services in APM",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
        environment: {
          type: "string",
          description: "Environment filter",
        },
        time_range: {
          type: "string",
          description: "Time range (e.g., '15m', '1h', '1d')",
          default: "15m",
        },
      },
    },
  },
  {
    name: "elastic_search_logs",
    description: "Search logs with custom query",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
        index: {
          type: "string",
          description: "Index pattern to search",
          default: "logs-*",
        },
        query: {
          type: "string",
          description: "Elasticsearch query string",
        },
        time_range: {
          type: "string",
          description: "Time range (e.g., '15m', '1h', '1d')",
          default: "15m",
        },
        size: {
          type: "number",
          description: "Number of results to return",
          default: 100,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "elastic_health_check",
    description: "Check Elasticsearch cluster health",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Elasticsearch host URL (overrides env ELASTIC_HOST)",
        },
      },
    },
  },
];
