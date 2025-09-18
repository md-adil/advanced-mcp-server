export const dockerTools = [
  {
    name: "docker_list_containers",
    description: "List Docker containers",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description: "Show all containers (including stopped)",
          default: false,
        },
        format: {
          type: "string",
          description: "Output format",
          default: "table",
        },
      },
    },
  },
  {
    name: "docker_run",
    description: "Run a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        image: { type: "string", description: "Docker image name" },
        name: { type: "string", description: "Container name" },
        ports: {
          type: "array",
          items: { type: "string" },
          description: "Port mappings (e.g., '8080:80')",
        },
        volumes: {
          type: "array",
          items: { type: "string" },
          description: "Volume mappings",
        },
        environment: { type: "object", description: "Environment variables" },
        detach: {
          type: "boolean",
          description: "Run in background",
          default: true,
        },
        remove: {
          type: "boolean",
          description: "Remove container when it exits",
          default: false,
        },
      },
      required: ["image"],
    },
  },
  {
    name: "docker_stop",
    description: "Stop a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        container: { type: "string", description: "Container ID or name" },
        timeout: {
          type: "number",
          description: "Timeout in seconds",
          default: 10,
        },
      },
      required: ["container"],
    },
  },
  {
    name: "docker_start",
    description: "Start a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        container: { type: "string", description: "Container ID or name" },
      },
      required: ["container"],
    },
  },
  {
    name: "docker_remove",
    description: "Remove a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        container: { type: "string", description: "Container ID or name" },
        force: {
          type: "boolean",
          description: "Force remove running container",
          default: false,
        },
      },
      required: ["container"],
    },
  },
  {
    name: "docker_logs",
    description: "Get Docker container logs",
    inputSchema: {
      type: "object",
      properties: {
        container: { type: "string", description: "Container ID or name" },
        tail: {
          type: "number",
          description: "Number of lines from end",
          default: 100,
        },
        follow: {
          type: "boolean",
          description: "Follow log output",
          default: false,
        },
        since: { type: "string", description: "Show logs since timestamp" },
      },
      required: ["container"],
    },
  },
  {
    name: "docker_exec",
    description: "Execute command in Docker container",
    inputSchema: {
      type: "object",
      properties: {
        container: { type: "string", description: "Container ID or name" },
        command: {
          type: "array",
          items: { type: "string" },
          description: "Command to execute",
        },
        interactive: {
          type: "boolean",
          description: "Keep STDIN open",
          default: false,
        },
        tty: {
          type: "boolean",
          description: "Allocate a pseudo-TTY",
          default: false,
        },
      },
      required: ["container", "command"],
    },
  },
  {
    name: "docker_images",
    description: "List Docker images",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description: "Show all images (including intermediates)",
          default: false,
        },
        filter: { type: "string", description: "Filter images" },
      },
    },
  },
  {
    name: "docker_build",
    description: "Build Docker image",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Build context path",
          default: ".",
        },
        tag: { type: "string", description: "Image tag" },
        dockerfile: { type: "string", description: "Dockerfile path" },
        buildArgs: { type: "object", description: "Build arguments" },
        noCache: {
          type: "boolean",
          description: "Do not use cache",
          default: false,
        },
      },
    },
  },
  {
    name: "docker_pull",
    description: "Pull Docker image",
    inputSchema: {
      type: "object",
      properties: {
        image: { type: "string", description: "Image name and tag" },
        platform: {
          type: "string",
          description: "Platform (e.g., linux/amd64)",
        },
      },
      required: ["image"],
    },
  },
  {
    name: "docker_compose",
    description: "Run Docker Compose commands",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["up", "down", "build", "logs", "ps"],
          description: "Compose action",
        },
        file: { type: "string", description: "Compose file path" },
        services: {
          type: "array",
          items: { type: "string" },
          description: "Specific services",
        },
        detach: {
          type: "boolean",
          description: "Detached mode",
          default: true,
        },
        build: {
          type: "boolean",
          description: "Build images before starting",
          default: false,
        },
      },
      required: ["action"],
    },
  },
];