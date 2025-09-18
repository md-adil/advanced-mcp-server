import { CommandResult, DockerContainer } from "../../types.ts";

export class DockerHandler {
  private async executeCommand(
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

  async listContainers(args: {
    all?: boolean;
    format?: string;
  }): Promise<DockerContainer[]> {
    const dockerArgs = ["ps"];
    if (args.all) dockerArgs.push("-a");
    dockerArgs.push("--format", "json");

    const result = await this.executeCommand("docker", dockerArgs);
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

  async run(args: {
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

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      containerId: result.stdout.trim(),
      message: result.stderr || "Container started successfully",
    };
  }

  async stop(args: { container: string; timeout?: number }) {
    const dockerArgs = ["stop"];
    if (args.timeout) dockerArgs.push("-t", args.timeout.toString());
    dockerArgs.push(args.container);

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || `Container ${args.container} stopped`,
    };
  }

  async start(args: { container: string }) {
    const result = await this.executeCommand("docker", [
      "start",
      args.container,
    ]);
    return {
      success: result.exitCode === 0,
      message: result.stderr || `Container ${args.container} started`,
    };
  }

  async remove(args: { container: string; force?: boolean }) {
    const dockerArgs = ["rm"];
    if (args.force) dockerArgs.push("-f");
    dockerArgs.push(args.container);

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || `Container ${args.container} removed`,
    };
  }

  async logs(args: {
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

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      logs: result.stdout,
      errors: result.stderr,
    };
  }

  async exec(args: {
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

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      errors: result.stderr,
      exitCode: result.exitCode,
    };
  }

  async images(args: { all?: boolean; filter?: string }) {
    const dockerArgs = ["images", "--format", "json"];
    if (args.all) dockerArgs.push("-a");
    if (args.filter) dockerArgs.push("--filter", args.filter);

    const result = await this.executeCommand("docker", dockerArgs);
    if (result.exitCode !== 0) {
      throw new Error(`Docker command failed: ${result.stderr}`);
    }

    return result.stdout
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  async build(args: {
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

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      errors: result.stderr,
    };
  }

  async pull(args: { image: string; platform?: string }) {
    const dockerArgs = ["pull"];
    if (args.platform) dockerArgs.push("--platform", args.platform);
    dockerArgs.push(args.image);

    const result = await this.executeCommand("docker", dockerArgs);
    return {
      success: result.exitCode === 0,
      message: result.stderr || `Image ${args.image} pulled successfully`,
    };
  }

  async compose(args: {
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

    const result = await this.executeCommand(
      composeArgs[0]!,
      composeArgs.slice(1)
    );
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      errors: result.stderr,
    };
  }
}
