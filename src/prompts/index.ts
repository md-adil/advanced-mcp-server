import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Prompt definitions
export const prompts = [
  {
    name: "debug_analysis",
    description: "Debug and analyze errors",
    arguments: [
      {
        name: "error_message",
        description: "Error message to analyze",
        required: true,
      },
      {
        name: "context",
        description: "Additional context",
        required: false,
      },
    ],
  },
  {
    name: "performance_optimization",
    description: "Performance optimization suggestions",
    arguments: [
      {
        name: "code_type",
        description: "Type of code (frontend, backend, etc.)",
        required: true,
      },
      {
        name: "current_metrics",
        description: "Current performance metrics",
        required: false,
      },
    ],
  },
];

// Prompt templates
const promptTemplates: Record<string, any> = {
  code_review: {
    description: "Comprehensive code review prompt",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: (args: Record<string, any>) => `Please review this ${args?.["language"] || "code"} for:
1. Code quality and best practices
2. Performance considerations
3. Security vulnerabilities
4. Maintainability issues
5. Potential bugs
6. Documentation completeness

Code to review:
\`\`\`${args?.["language"] || "text"}
${args?.["code"] || ""}
\`\`\`

Provide detailed feedback with specific suggestions for improvement.`,
        },
      },
    ],
  },
  debug_analysis: {
    description: "Debug and analyze errors",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: (args: Record<string, any>) => `Please analyze this error and provide debugging guidance:

Error: ${args?.["error_message"] || ""}

${args?.["context"] ? `Context: ${args["context"]}` : ""}

Please provide:
1. Likely causes of this error
2. Step-by-step debugging approach
3. Potential solutions
4. Prevention strategies`,
        },
      },
    ],
  },
  performance_optimization: {
    description: "Performance optimization suggestions",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: (args: Record<string, any>) => `Please provide performance optimization suggestions for ${
            args?.["code_type"] || "this application"
          }.

${
  args?.["current_metrics"] ? `Current metrics: ${args["current_metrics"]}` : ""
}

Focus on:
1. Algorithmic improvements
2. Resource utilization
3. Caching strategies
4. Database optimization (if applicable)
5. Monitoring and profiling recommendations
6. Infrastructure considerations`,
        },
      },
    ],
  },
  security_audit: {
    description: "Security audit checklist",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: (args: Record<string, any>) => `Please provide a security audit checklist for a ${
            args?.["application_type"] || "web application"
          }.

${args?.["tech_stack"] ? `Technology stack: ${args["tech_stack"]}` : ""}

Include:
1. Authentication and authorization
2. Input validation and sanitization
3. Data encryption and storage
4. API security
5. Infrastructure security
6. Dependency management
7. Logging and monitoring
8. Compliance considerations`,
        },
      },
    ],
  },
};

// Prompt handlers
export function setupPromptHandlers(server: any) {
  // List prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
  });

  // Get prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;

    const template = promptTemplates[name];
    if (!template) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    // Process template with arguments
    const processedTemplate = {
      ...template,
      messages: template.messages.map((message: any) => ({
        ...message,
        content: {
          ...message.content,
          text: typeof message.content.text === "function"
            ? message.content.text(args || {})
            : message.content.text,
        },
      })),
    };

    return processedTemplate;
  });
}