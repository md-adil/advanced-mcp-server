export const websocketTools = [
  {
    name: "ws_connect",
    description: "Connect to a WebSocket server",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "WebSocket URL" },
        protocols: {
          type: "array",
          items: { type: "string" },
          description: "WebSocket protocols",
        },
        timeout: {
          type: "number",
          description: "Connection timeout in ms",
          default: 10000,
        },
      },
      required: ["url"],
    },
  },
  {
    name: "ws_send",
    description: "Send message to WebSocket connection",
    inputSchema: {
      type: "object",
      properties: {
        connectionId: { type: "string", description: "Connection ID" },
        message: { type: "string", description: "Message to send" },
        type: { type: "string", enum: ["text", "binary"], default: "text" },
      },
      required: ["connectionId", "message"],
    },
  },
  {
    name: "ws_listen",
    description: "Listen for WebSocket messages",
    inputSchema: {
      type: "object",
      properties: {
        connectionId: { type: "string", description: "Connection ID" },
        duration: {
          type: "number",
          description: "Listen duration in seconds",
          default: 30,
        },
        maxMessages: {
          type: "number",
          description: "Maximum messages to collect",
          default: 100,
        },
      },
      required: ["connectionId"],
    },
  },
  {
    name: "ws_close",
    description: "Close WebSocket connection",
    inputSchema: {
      type: "object",
      properties: {
        connectionId: { type: "string", description: "Connection ID" },
        code: { type: "number", description: "Close code", default: 1000 },
        reason: { type: "string", description: "Close reason" },
      },
      required: ["connectionId"],
    },
  },
  {
    name: "ws_list_connections",
    description: "List active WebSocket connections",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ws_ping",
    description: "Send ping to WebSocket connection",
    inputSchema: {
      type: "object",
      properties: {
        connectionId: { type: "string", description: "Connection ID" },
        data: { type: "string", description: "Ping data" },
      },
      required: ["connectionId"],
    },
  },
];

interface WebSocketConnection {
  id: string;
  url: string;
  socket: WebSocket;
  messages: Array<{ timestamp: string; type: string; data: string }>;
  connected: boolean;
  createdAt: string;
}

export class WebSocketHandler {
  private connections = new Map<string, WebSocketConnection>();
  private nextId = 1;

  async connect(args: { url: string; protocols?: string[]; timeout?: number }) {
    const connectionId = `ws_${this.nextId++}`;

    return new Promise<{
      connectionId: string;
      success: boolean;
      message: string;
    }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, args.timeout || 10000);

      const socket = new WebSocket(args.url, args.protocols);

      const connection: WebSocketConnection = {
        id: connectionId,
        url: args.url,
        socket,
        messages: [],
        connected: false,
        createdAt: new Date().toISOString(),
      };

      socket.onopen = () => {
        clearTimeout(timeout);
        connection.connected = true;
        this.connections.set(connectionId, connection);
        resolve({
          connectionId,
          success: true,
          message: `Connected to ${args.url}`,
        });
      };

      socket.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket error: ${error}`));
      };

      socket.onmessage = (event) => {
        connection.messages.push({
          timestamp: new Date().toISOString(),
          type: typeof event.data === "string" ? "text" : "binary",
          data: event.data.toString(),
        });

        // Keep only last 1000 messages
        if (connection.messages.length > 1000) {
          connection.messages = connection.messages.slice(-500);
        }
      };

      socket.onclose = (event) => {
        connection.connected = false;
        connection.messages.push({
          timestamp: new Date().toISOString(),
          type: "close",
          data: `Connection closed: ${event.code} ${event.reason}`,
        });
      };
    });
  }

  async send(args: { connectionId: string; message: string; type?: string }) {
    const connection = this.connections.get(args.connectionId);
    if (!connection) {
      throw new Error(`Connection ${args.connectionId} not found`);
    }

    if (!connection.connected) {
      throw new Error(`Connection ${args.connectionId} is not connected`);
    }

    try {
      if (args.type === "binary") {
        const encoder = new TextEncoder();
        connection.socket.send(encoder.encode(args.message));
      } else {
        connection.socket.send(args.message);
      }

      return {
        success: true,
        message: "Message sent successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${(error as Error).message}`);
    }
  }

  async listen(args: {
    connectionId: string;
    duration?: number;
    maxMessages?: number;
  }) {
    const connection = this.connections.get(args.connectionId);
    if (!connection) {
      throw new Error(`Connection ${args.connectionId} not found`);
    }

    const startTime = Date.now();
    const initialCount = connection.messages.length;
    const maxMessages = args.maxMessages || 100;
    const duration = (args.duration || 30) * 1000;

    return new Promise<{
      messages: typeof connection.messages;
      duration: number;
    }>((resolve) => {
      const checkMessages = () => {
        const elapsed = Date.now() - startTime;
        const newMessages = connection.messages.slice(initialCount);

        if (elapsed >= duration || newMessages.length >= maxMessages) {
          resolve({
            messages: newMessages,
            duration: elapsed / 1000,
          });
        } else {
          setTimeout(checkMessages, 100);
        }
      };

      checkMessages();
    });
  }

  async close(args: { connectionId: string; code?: number; reason?: string }) {
    const connection = this.connections.get(args.connectionId);
    if (!connection) {
      throw new Error(`Connection ${args.connectionId} not found`);
    }

    try {
      connection.socket.close(args.code || 1000, args.reason);
      this.connections.delete(args.connectionId);

      return {
        success: true,
        message: `Connection ${args.connectionId} closed`,
      };
    } catch (error) {
      throw new Error(
        `Failed to close connection: ${(error as Error).message}`
      );
    }
  }

  async listConnections() {
    const connections = Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      url: conn.url,
      connected: conn.connected,
      messageCount: conn.messages.length,
      createdAt: conn.createdAt,
      readyState: conn.socket.readyState,
      readyStateText: this.getReadyStateText(conn.socket.readyState),
    }));

    return {
      connections,
      totalConnections: connections.length,
      activeConnections: connections.filter((c) => c.connected).length,
    };
  }

  async ping(args: { connectionId: string; data?: string }) {
    const connection = this.connections.get(args.connectionId);
    if (!connection) {
      throw new Error(`Connection ${args.connectionId} not found`);
    }

    if (!connection.connected) {
      throw new Error(`Connection ${args.connectionId} is not connected`);
    }

    try {
      // WebSocket ping is typically handled at the protocol level
      // For application-level ping, we send a text message
      const pingMessage = JSON.stringify({
        type: "ping",
        data: args.data || "ping",
        timestamp: new Date().toISOString(),
      });

      connection.socket.send(pingMessage);

      return {
        success: true,
        message: "Ping sent",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to send ping: ${(error as Error).message}`);
    }
  }

  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }

  // Cleanup method to close all connections
  async cleanup() {
    for (const [id, connection] of this.connections) {
      try {
        connection.socket.close();
      } catch (error) {
        console.error(`Error closing connection ${id}:`, error);
      }
    }
    this.connections.clear();
  }
}
