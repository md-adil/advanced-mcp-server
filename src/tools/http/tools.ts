export const httpTools = [
  {
    name: "http_request",
    description: "Make HTTP requests",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to request" },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          default: "GET",
        },
        headers: { type: "object", description: "Request headers" },
        body: { type: "string", description: "Request body" },
        timeout: {
          type: "number",
          description: "Timeout in ms",
          default: 10000,
        },
      },
      required: ["url"],
    },
  },
];