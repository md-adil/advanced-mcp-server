import { CommandResult, DockerContainer } from "../../types.ts";

// Utility function to execute commands
async function executeCommand(
  command: string,
  args: string[]
): Promise<CommandResult> {
  const cmd = new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();
  return {
    exitCode: code,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
  };
}

// Individual tool functions
async function listContainers(args: {
  all?: boolean;
  format?: string;
}): Promise<DockerContainer[]> {
  const dockerArgs = ["ps"];
  if (args.all) dockerArgs.push("-a");
  dockerArgs.push("--format", "json");

  const result = await executeCommand("docker", dockerArgs);
  if (result.exitCode !== 0) {
    throw new Error(`Docker command failed: ${result.stderr}`);
  }

  return result.stdout
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const container = JSON.parse(line);
      return {
        id: container.ID,
        name: container.Names,
        image: container.Image,
        status: container.Status,
        ports: container.Ports ? container.Ports.split(", ") : [],
        created: container.CreatedAt,
      };
    });
}

async function run(args: {
  image: string;
  name?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  detach?: boolean;
  remove?: boolean;
}) {
  const dockerArgs = ["run"];

  if (args.detach) dockerArgs.push("-d");
  if (args.remove) dockerArgs.push("--rm");
  if (args.name) dockerArgs.push("--name", args.name);

  if (args.ports) {
    args.ports.forEach((port) => {
      dockerArgs.push("-p", port);
    });
  }

  if (args.volumes) {
    args.volumes.forEach((volume) => {
      dockerArgs.push("-v", volume);
    });
  }

  if (args.environment) {
    Object.entries(args.environment).forEach(([key, value]) => {
      dockerArgs.push("-e", `${key}=${value}`);
    });
  }

  dockerArgs.push(args.image);

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    containerId: result.stdout.trim(),
    message: result.stderr || "Container started successfully",
  };
}

async function stop(args: { container: string; timeout?: number }) {
  const dockerArgs = ["stop"];
  if (args.timeout) dockerArgs.push("-t", args.timeout.toString());
  dockerArgs.push(args.container);

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || `Container ${args.container} stopped`,
  };
}

async function start(args: { container: string }) {
  const result = await executeCommand("docker", [
    "start",
    args.container,
  ]);
  return {
    success: result.exitCode === 0,
    message: result.stderr || `Container ${args.container} started`,
  };
}

async function remove(args: { container: string; force?: boolean }) {
  const dockerArgs = ["rm"];
  if (args.force) dockerArgs.push("-f");
  dockerArgs.push(args.container);

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || `Container ${args.container} removed`,
  };
}

async function logs(args: {
  container: string;
  tail?: number;
  follow?: boolean;
  since?: string;
}) {
  const dockerArgs = ["logs"];
  if (args.tail) dockerArgs.push("--tail", args.tail.toString());
  if (args.follow) dockerArgs.push("-f");
  if (args.since) dockerArgs.push("--since", args.since);
  dockerArgs.push(args.container);

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    logs: result.stdout,
    errors: result.stderr,
  };
}

async function exec(args: {
  container: string;
  command: string[];
  interactive?: boolean;
  tty?: boolean;
}) {
  const dockerArgs = ["exec"];
  if (args.interactive) dockerArgs.push("-i");
  if (args.tty) dockerArgs.push("-t");
  dockerArgs.push(args.container);
  dockerArgs.push(...args.command);

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    output: result.stdout,
    errors: result.stderr,
    exitCode: result.exitCode,
  };
}

async function images(args: { all?: boolean; filter?: string }) {
  const dockerArgs = ["images", "--format", "json"];
  if (args.all) dockerArgs.push("-a");
  if (args.filter) dockerArgs.push("--filter", args.filter);

  const result = await executeCommand("docker", dockerArgs);
  if (result.exitCode !== 0) {
    throw new Error(`Docker command failed: ${result.stderr}`);
  }

  return result.stdout
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function build(args: {
  path?: string;
  tag?: string;
  dockerfile?: string;
  buildArgs?: Record<string, string>;
  noCache?: boolean;
}) {
  const dockerArgs = ["build"];
  if (args.tag) dockerArgs.push("-t", args.tag);
  if (args.dockerfile) dockerArgs.push("-f", args.dockerfile);
  if (args.noCache) dockerArgs.push("--no-cache");

  if (args.buildArgs) {
    Object.entries(args.buildArgs).forEach(([key, value]) => {
      dockerArgs.push("--build-arg", `${key}=${value}`);
    });
  }

  dockerArgs.push(args.path || ".");

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    output: result.stdout,
    errors: result.stderr,
  };
}

async function pull(args: { image: string; platform?: string }) {
  const dockerArgs = ["pull"];
  if (args.platform) dockerArgs.push("--platform", args.platform);
  dockerArgs.push(args.image);

  const result = await executeCommand("docker", dockerArgs);
  return {
    success: result.exitCode === 0,
    message: result.stderr || `Image ${args.image} pulled successfully`,
  };
}

async function compose(args: {
  action: string;
  file?: string;
  services?: string[];
  detach?: boolean;
  build?: boolean;
}) {
  const composeArgs = ["docker-compose"];
  if (args.file) composeArgs.push("-f", args.file);

  composeArgs.push(args.action);

  if (args.action === "up") {
    if (args.detach) composeArgs.push("-d");
    if (args.build) composeArgs.push("--build");
  }

  if (args.services) {
    composeArgs.push(...args.services);
  }

  const result = await executeCommand(
    composeArgs[0]!,
    composeArgs.slice(1)
  );
  return {
    success: result.exitCode === 0,
    output: result.stdout,
    errors: result.stderr,
  };
}

// Main execution function - handles all docker tool cases
export async function executeDockerTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "docker_list_containers":
      return await listContainers(args as { all?: boolean; format?: string });
    case "docker_run":
      return await run(args as {
        image: string;
        name?: string;
        ports?: string[];
        volumes?: string[];
        environment?: Record<string, string>;
        detach?: boolean;
        remove?: boolean;
      });
    case "docker_stop":
      return await stop(args as { container: string; timeout?: number });
    case "docker_start":
      return await start(args as { container: string });
    case "docker_remove":
      return await remove(args as { container: string; force?: boolean });
    case "docker_logs":
      return await logs(args as {
        container: string;
        tail?: number;
        follow?: boolean;
        since?: string;
      });
    case "docker_exec":
      return await exec(args as {
        container: string;
        command: string[];
        interactive?: boolean;
        tty?: boolean;
      });
    case "docker_images":
      return await images(args as { all?: boolean; filter?: string });
    case "docker_build":
      return await build(args as {
        path?: string;
        tag?: string;
        dockerfile?: string;
        buildArgs?: Record<string, string>;
        noCache?: boolean;
      });
    case "docker_pull":
      return await pull(args as { image: string; platform?: string });
    case "docker_compose":
      return await compose(args as {
        action: string;
        file?: string;
        services?: string[];
        detach?: boolean;
        build?: boolean;
      });
    default:
      throw new Error(`Unknown docker tool: ${name}`);
  }
}