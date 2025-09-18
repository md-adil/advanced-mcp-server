// Re-export from the main websocket file for now
export { websocketTools } from "../websocket.ts";

// Function wrapper for the existing class-based handler
export async function executeWebSocketTool(name: string, args: Record<string, unknown>) {
  // This is a simplified wrapper - in production, you'd want to refactor to pure functions
  const { WebSocketHandler } = await import("../websocket.ts");
  const handler = new WebSocketHandler();

  switch (name) {
    case "ws_connect":
      return await handler.connect(args as { url: string; protocols?: string[]; timeout?: number });
    case "ws_send":
      return await handler.send(args as { connectionId: string; message: string; type?: string });
    case "ws_listen":
      return await handler.listen(args as { connectionId: string; duration?: number; maxMessages?: number });
    case "ws_close":
      return await handler.close(args as { connectionId: string; code?: number; reason?: string });
    case "ws_list_connections":
      return await handler.listConnections();
    case "ws_ping":
      return await handler.ping(args as { connectionId: string; data?: string });
    default:
      throw new Error(`Unknown websocket tool: ${name}`);
  }
}