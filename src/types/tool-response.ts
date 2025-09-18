/**
 * MCP Tool Call Response Types
 * Defines the expected response format for tool calls
 */

// Base content types that can be returned in tool responses
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  data: string; // Base64 encoded image data
  mimeType: string; // e.g., "image/png", "image/jpeg"
}

export interface ResourceContent {
  type: "resource";
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
  };
}

// Union type for all possible content types
export type ToolContent = TextContent | ImageContent | ResourceContent;

// Main tool response structure
export interface ToolCallResponse {
  content: ToolContent[];
}

// Helper type for tools that want to return simple data (will be auto-wrapped)
export type ToolResult =
  | ToolCallResponse
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null;

// Type guards to check content types
export function isTextContent(content: ToolContent): content is TextContent {
  return content.type === "text";
}

export function isImageContent(content: ToolContent): content is ImageContent {
  return content.type === "image";
}

export function isResourceContent(
  content: ToolContent
): content is ResourceContent {
  return content.type === "resource";
}

// Helper functions to create content
export function createTextContent(text: string): TextContent {
  return { type: "text", text };
}

export function createImageContent(
  base64Data: string,
  mimeType: string
): ImageContent {
  return { type: "image", data: base64Data, mimeType };
}

export function createResourceContent(
  uri: string,
  mimeType?: string,
  text?: string
): ResourceContent {
  const resource: { uri: string; mimeType?: string; text?: string } = { uri };
  if (mimeType !== undefined) resource.mimeType = mimeType;
  if (text !== undefined) resource.text = text;

  return {
    type: "resource",
    resource,
  };
}

// Helper to create a complete tool response
export function createToolResponse(
  ...content: ToolContent[]
): ToolCallResponse {
  return { content };
}

// Helper to wrap simple data in default text format
export function wrapAsTextResponse(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  } as const;
}
