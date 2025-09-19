export async function httpRequest(args: {
  url: string;
  method?: string;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  timeout?: number;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), args.timeout || 10000);

  try {
    const response = await fetch(args.url, {
      method: args.method || "GET",
      headers: new Headers(args.headers),
      body: args.body || null,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const body = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
