export const cacheTools = [
  {
    name: "cache_set",
    description: "Set cache value for server operations",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Cache key" },
        value: { type: "string", description: "Cache value" },
        ttl: {
          type: "number",
          description: "Time to live in seconds",
          default: 3600,
        },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "cache_get",
    description: "Get cached value from server",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Cache key" },
      },
      required: ["key"],
    },
  },
  {
    name: "cache_delete",
    description: "Delete cached value from server",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Cache key" },
      },
      required: ["key"],
    },
  },
];