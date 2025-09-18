export const metricsTools = [
  {
    name: "metrics_current",
    description: "Get current system metrics (CPU, memory, disk)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "metrics_history",
    description: "Get historical metrics data",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of historical entries to return",
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: "metrics_start_collection",
    description: "Start metrics collection with specified interval",
    inputSchema: {
      type: "object",
      properties: {
        interval: {
          type: "number",
          description: "Collection interval in milliseconds",
          default: 30000,
        },
      },
      required: [],
    },
  },
  {
    name: "metrics_stop_collection",
    description: "Stop metrics collection",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "metrics_clear_history",
    description: "Clear metrics history",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];