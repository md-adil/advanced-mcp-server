export const osTools = [
  {
    name: "os_osascript",
    description: "Execute AppleScript or JavaScript for Automation on macOS",
    inputSchema: {
      type: "object",
      properties: {
        script: {
          type: "string",
          description: "AppleScript or JavaScript code to execute"
        },
        language: {
          type: "string",
          enum: ["applescript", "javascript"],
          default: "applescript",
          description: "Script language to use"
        },
      },
      required: ["script"],
    },
  },
  {
    name: "os_command",
    description: "Execute shell commands on macOS",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Shell command to execute"
        },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Command arguments",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds",
          default: 30000,
        },
      },
      required: ["command"],
    },
  },
  {
    name: "os_screenshot",
    description: "Take an interactive screenshot on macOS - opens selection UI for user to choose area",
    inputSchema: {
      type: "object",
      properties: {
        region: {
          type: "string",
          enum: ["selection", "window", "fullscreen"],
          default: "selection",
          description: "Screenshot region: 'selection' opens crosshair to select area, 'window' to click on window, 'fullscreen' captures entire screen"
        },
        format: {
          type: "string",
          enum: ["png", "jpg"],
          default: "png",
          description: "Output format"
        },
        delay: {
          type: "number",
          description: "Delay before screenshot in seconds",
          default: 0
        },
      },
      required: [],
    },
  },
];