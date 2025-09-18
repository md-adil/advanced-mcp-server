import { ToolResult } from "../../types/tool-response.ts";

// Utility function to execute kubectl commands
async function executeKubectl(args: string[], timeout: number = 30000): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  const command = new Deno.Command("kubectl", {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const { code, stdout, stderr } = await command.output();
    clearTimeout(timeoutId);
    return {
      exitCode: code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Individual tool functions
async function getKubectlCommands(args: { category?: string }): Promise<ToolResult> {
  // Comprehensive kubectl commands organized by category
  const kubectlCommands = {
    get: [
      { command: "kubectl get pods", description: "List all pods in current namespace" },
      { command: "kubectl get services", description: "List all services in current namespace" },
      { command: "kubectl get deployments", description: "List all deployments in current namespace" },
      { command: "kubectl get nodes", description: "List all nodes in the cluster" },
      { command: "kubectl get namespaces", description: "List all namespaces" },
      { command: "kubectl get configmaps", description: "List all configmaps in current namespace" },
      { command: "kubectl get secrets", description: "List all secrets in current namespace" },
      { command: "kubectl get ingress", description: "List all ingress resources in current namespace" },
      { command: "kubectl get pv", description: "List all persistent volumes" },
      { command: "kubectl get pvc", description: "List all persistent volume claims in current namespace" }
    ],
    create: [
      { command: "kubectl create deployment", description: "Create a new deployment" },
      { command: "kubectl create service", description: "Create a new service" },
      { command: "kubectl create namespace", description: "Create a new namespace" },
      { command: "kubectl create configmap", description: "Create a new configmap" },
      { command: "kubectl create secret", description: "Create a new secret" }
    ],
    apply: [
      { command: "kubectl apply -f", description: "Apply configuration from file or URL" },
      { command: "kubectl apply -k", description: "Apply kustomization directory" }
    ],
    delete: [
      { command: "kubectl delete pod", description: "Delete a pod" },
      { command: "kubectl delete service", description: "Delete a service" },
      { command: "kubectl delete deployment", description: "Delete a deployment" },
      { command: "kubectl delete namespace", description: "Delete a namespace" }
    ],
    describe: [
      { command: "kubectl describe pod", description: "Show detailed information about a pod" },
      { command: "kubectl describe service", description: "Show detailed information about a service" },
      { command: "kubectl describe deployment", description: "Show detailed information about a deployment" },
      { command: "kubectl describe node", description: "Show detailed information about a node" }
    ],
    logs: [
      { command: "kubectl logs", description: "Print logs from a pod" },
      { command: "kubectl logs -f", description: "Follow log output from a pod" },
      { command: "kubectl logs --previous", description: "Print logs from previous pod instance" }
    ],
    exec: [
      { command: "kubectl exec -it", description: "Execute command in a pod interactively" },
      { command: "kubectl exec", description: "Execute command in a pod" }
    ],
    "port-forward": [
      { command: "kubectl port-forward", description: "Forward local port to pod port" },
      { command: "kubectl port-forward service/", description: "Forward local port to service port" }
    ],
    config: [
      { command: "kubectl config view", description: "Show kubeconfig settings" },
      { command: "kubectl config current-context", description: "Show current context" },
      { command: "kubectl config get-contexts", description: "List all contexts" },
      { command: "kubectl config use-context", description: "Switch to a different context" },
      { command: "kubectl config set-context", description: "Set context configuration" }
    ]
  };

  let filteredCommands;
  if (args.category && kubectlCommands[args.category as keyof typeof kubectlCommands]) {
    filteredCommands = {
      [args.category]: kubectlCommands[args.category as keyof typeof kubectlCommands]
    };
  } else {
    filteredCommands = kubectlCommands;
  }

  return {
    success: true,
    commands: filteredCommands,
    total_commands: Object.values(filteredCommands).flat().length,
    categories: Object.keys(filteredCommands)
  };
}

async function listNamespaces(args: {
  show_labels?: boolean;
  output_format?: string
}): Promise<ToolResult> {
  const kubectlArgs = ["get", "namespaces"];

  // Add output format
  if (args.output_format) {
    kubectlArgs.push("-o", args.output_format);
  }

  // Add labels flag
  if (args.show_labels) {
    kubectlArgs.push("--show-labels");
  }

  try {
    const result = await executeKubectl(kubectlArgs);

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: result.stderr || "Failed to list namespaces",
        exit_code: result.exitCode
      };
    }

    // Parse output based on format
    let parsedOutput;
    if (args.output_format === "json") {
      try {
        parsedOutput = JSON.parse(result.stdout);
      } catch (e) {
        parsedOutput = result.stdout;
      }
    } else {
      parsedOutput = result.stdout;
    }

    return {
      success: true,
      namespaces: parsedOutput,
      output_format: args.output_format || "table",
      raw_output: result.stdout
    };
  } catch (error) {
    return {
      success: false,
      error: `kubectl command failed: ${(error as Error).message}`
    };
  }
}

async function kubectlExecute(args: {
  command: string;
  namespace?: string;
  output_format?: string;
  timeout?: number;
}): Promise<ToolResult> {
  // Parse the command string into arguments
  const commandArgs = args.command.trim().split(/\s+/);

  // Build kubectl arguments
  const kubectlArgs = [...commandArgs];

  // Add namespace if specified
  if (args.namespace) {
    kubectlArgs.push("-n", args.namespace);
  }

  // Add output format if specified
  if (args.output_format) {
    kubectlArgs.push("-o", args.output_format);
  }

  const timeoutMs = (args.timeout || 30) * 1000;

  try {
    const result = await executeKubectl(kubectlArgs, timeoutMs);

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: result.stderr || "kubectl command failed",
        exit_code: result.exitCode,
        command: `kubectl ${args.command}`,
        stderr: result.stderr
      };
    }

    // Parse output based on format
    let parsedOutput;
    if (args.output_format === "json") {
      try {
        parsedOutput = JSON.parse(result.stdout);
      } catch (e) {
        parsedOutput = result.stdout;
      }
    } else {
      parsedOutput = result.stdout;
    }

    return {
      success: true,
      command: `kubectl ${args.command}`,
      output: parsedOutput,
      raw_output: result.stdout,
      output_format: args.output_format || "table",
      namespace: args.namespace || "default",
      exit_code: result.exitCode
    };
  } catch (error) {
    return {
      success: false,
      error: `kubectl command failed: ${(error as Error).message}`,
      command: `kubectl ${args.command}`
    };
  }
}

// Main execution function - handles all kubernetes tool cases
export async function executeKubernetesTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "kubernetes_get_commands":
      return await getKubectlCommands(args as { category?: string });
    case "kubernetes_list_namespaces":
      return await listNamespaces(args as {
        show_labels?: boolean;
        output_format?: string
      });
    case "kubernetes_kubectl_execute":
      return await kubectlExecute(args as {
        command: string;
        namespace?: string;
        output_format?: string;
        timeout?: number;
      });
    default:
      throw new Error(`Unknown kubernetes tool: ${name}`);
  }
}