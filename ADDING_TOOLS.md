# Adding New Tools to the MCP Server

This document explains how to add new tools to the simplified, centralized tool system.

## Quick Steps

1. **Create your tool directory**: `src/tools/your-tool/`
2. **Add 3 files**: `tools.ts`, `handler.ts`, `index.ts`
3. **Register in registry**: Add one import and one line to `src/tools/registry.ts`

That's it! No need to modify multiple files across the codebase.

## Detailed Example

### 1. Create Tool Directory
```bash
mkdir src/tools/example
```

### 2. Create tools.ts
```typescript
export const exampleTools = [
  {
    name: "example_hello",
    description: "Say hello with a custom message",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to display" },
      },
      required: ["message"],
    },
  },
];
```

### 3. Create handler.ts
```typescript
function sayHello(args: { message: string }) {
  return { greeting: `Hello! ${args.message}` };
}

export function executeExampleTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "example_hello":
      return sayHello(args as { message: string });
    default:
      throw new Error(`Unknown example tool: ${name}`);
  }
}
```

### 4. Create index.ts
```typescript
export { exampleTools } from "./tools.ts";
export { executeExampleTool } from "./handler.ts";
```

### 5. Register in registry.ts
Add these two lines to `src/tools/registry.ts`:

```typescript
// Add import
import { exampleTools, executeExampleTool } from "./example/index.ts";

// Add to toolRegistry object
export const toolRegistry = {
  // ... existing tools ...
  example: { tools: exampleTools, executor: executeExampleTool },
} as const;
```

## Automatic Features

Once registered, your tools automatically get:

- ✅ Listed in tool discovery
- ✅ Routed to correct executor
- ✅ Included in tools summary resource
- ✅ Error handling and logging
- ✅ JSON serialization of results

## Tool Naming Convention

Use prefixes for automatic routing:
- `your-category_` → Routes to your executor
- Special cases: `http_request`, `exec_command`

## Dependencies

If your tool needs server dependencies (cache, metrics, etc.):

```typescript
// In registry.ts executeTool function, add special handling:
if (name.startsWith("your-category_")) {
  return await executeYourTool(name, args, dependencies.yourDependency);
}
```

## Content Formatting

Tools have **full control** over their response format. You can return:

### Option 1: Raw Data (Default)
```typescript
function myTool(args: any) {
  return { status: "success", data: "Hello World" };
}
// Server auto-wraps in: { content: [{ type: "text", text: JSON.stringify(result) }] }
```

### Option 2: Typed Response (Recommended)
```typescript
import { createToolResponse, createTextContent, createImageContent } from "../../types/tool-response.ts";

function myImageTool(args: { base64Data: string }) {
  return createToolResponse(
    createTextContent("Here's your image:"),
    createImageContent(args.base64Data, "image/jpeg")
  );
}
```

### Option 3: Manual Content Format
```typescript
import { ToolCallResponse } from "../../types/tool-response.ts";

function myMixedTool(args: any): ToolCallResponse {
  return {
    content: [
      { type: "text", text: "Analysis complete:" },
      { type: "text", text: JSON.stringify(data, null, 2) },
      { type: "image", data: "base64data", mimeType: "image/png" }
    ]
  };
}
```

### Helper Functions Available

```typescript
// Import these from "../../types/tool-response.ts"
createTextContent(text: string)
createImageContent(base64Data: string, mimeType: string)
createResourceContent(uri: string, mimeType?: string, text?: string)
createToolResponse(...content: ToolContent[])
wrapAsTextResponse(data: unknown) // For simple data
```

### Supported Content Types

- `{ type: "text", text: "..." }` - Plain text
- `{ type: "image", data: "...", mimeType: "..." }` - Images
- `{ type: "resource", uri: "..." }` - Resource references
- Any MCP content type you need

## That's It!

The centralized registry system handles all the complexity. Adding new tools is now a simple 3-file + 1-registration process with full control over content formatting!