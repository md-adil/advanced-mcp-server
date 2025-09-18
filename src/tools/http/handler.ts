async function httpRequest(args: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    args.timeout || 10000
  );

  try {
    const response = await fetch(args.url, {
      method: args.method || "GET",
      headers: new Headers(args.headers),
      body: args.body || null,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Functional interface for tool execution
export function executeHttpTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "http_request":
      return httpRequest(args as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        timeout?: number;
      });
    default:
      throw new Error(`Unknown HTTP tool: ${name}`);
  }
}