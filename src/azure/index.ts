import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { wrapAsTextResponse } from "../utils/tools.ts";
import {
  getProjects,
  getRepositories,
  getUsers,
  getWorkItems,
  getTasks,
  getUserStories,
  getPipelines,
  getBranches,
  getPullRequests,
} from "./handler.ts";

export function azureModule(server: McpServer) {
  server.registerTool(
    "azure_config_check",
    {
      description: "Check Azure DevOps configuration and environment variables",
      inputSchema: {},
    },
    () => {
      return wrapAsTextResponse({
        status: "success",
        message: "Azure DevOps configuration is valid",
        timestamp: new Date().toISOString(),
      });
    }
  );

  server.registerTool(
    "azure_projects",
    {
      description: "Get list of Azure DevOps projects",
      inputSchema: {},
    },
    async () => {
      return wrapAsTextResponse(await getProjects());
    }
  );

  server.registerTool(
    "azure_repositories",
    {
      description: "Get list of Azure DevOps repositories",
      inputSchema: {
        project: z.string().describe("Project name or ID"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getRepositories(args));
    }
  );

  server.registerTool(
    "azure_users",
    {
      description: "Get list of Azure DevOps users",
      inputSchema: {
        project: z.string().optional().describe("Project name or ID"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getUsers(args));
    }
  );

  server.registerTool(
    "azure_work_items",
    {
      description: "Get list of Azure DevOps work items",
      inputSchema: {
        project: z.string().optional().describe("Project name or ID"),
        type: z
          .string()
          .optional()
          .describe("Work item type (e.g., Task, User Story, Bug)"),
        state: z
          .string()
          .optional()
          .describe("Work item state (e.g., New, Active, Closed)"),
        assigned_to: z
          .string()
          .optional()
          .describe("Assigned to user email or name"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getWorkItems(args));
    }
  );

  server.registerTool(
    "azure_tasks",
    {
      description: "Get list of Azure DevOps tasks",
      inputSchema: {
        project: z.string().optional().describe("Project name or ID"),
        assigned_to: z
          .string()
          .optional()
          .describe("Assigned to user email or name"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getTasks(args));
    }
  );

  server.registerTool(
    "azure_user_stories",
    {
      description: "Get list of Azure DevOps user stories",
      inputSchema: {
        project: z.string().optional().describe("Project name or ID"),
        state: z
          .string()
          .optional()
          .describe("User story state (e.g., New, Active, Closed)"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getUserStories(args));
    }
  );

  server.registerTool(
    "azure_pipelines",
    {
      description: "Get list of Azure DevOps pipelines",
      inputSchema: {
        project: z.string().describe("Project name or ID"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getPipelines(args));
    }
  );

  server.registerTool(
    "azure_branches",
    {
      description: "Get list of Azure DevOps repository branches",
      inputSchema: {
        project: z.string().describe("Project name or ID"),
        repository: z.string().describe("Repository name or ID"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getBranches(args));
    }
  );

  server.registerTool(
    "azure_pull_requests",
    {
      description: "Get list of Azure DevOps pull requests",
      inputSchema: {
        project: z.string().describe("Project name or ID"),
        repository: z.string().describe("Repository name or ID"),
        status: z
          .string()
          .optional()
          .describe("Pull request status (e.g., active, completed, abandoned)"),
      },
    },
    async (args) => {
      return wrapAsTextResponse(await getPullRequests(args));
    }
  );

  // Register Azure resources
  server.registerResource(
    "azure-projects",
    "azure://projects",
    {
      name: "Azure DevOps Projects",
      description: "List of Azure DevOps projects in the organization",
      mimeType: "application/json",
    },
    async ({ href }) => {
      try {
        const projects = await getProjects();
        return {
          contents: [
            {
              uri: href,
              mimeType: "application/json",
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: href,
              mimeType: "application/json",
              text: JSON.stringify({ error: String(error) }, null, 2),
            },
          ],
        };
      }
    }
  );

  server.registerResource(
    "azure-users",
    "azure://users",
    {
      name: "Azure DevOps Users",
      description: "List of Azure DevOps users in the organization",
      mimeType: "application/json",
    },
    async ({ href }) => {
      try {
        const users = await getUsers({});
        return {
          contents: [
            {
              uri: href,
              mimeType: "application/json",
              text: JSON.stringify(users, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: href,
              mimeType: "application/json",
              text: JSON.stringify({ error: String(error) }, null, 2),
            },
          ],
        };
      }
    }
  );

  server.registerResource(
    "azure-recent-work-items",
    "azure://work-items/recent",
    {
      name: "Recent Azure Work Items",
      description: "Recently created work items from Azure Boards",
      mimeType: "application/json",
    },
    async ({ href }) => {
      const workItems = await getWorkItems({});
      return {
        contents: [
          {
            uri: href,
            mimeType: "application/json",
            text: JSON.stringify(workItems, null, 2),
          },
        ],
      };
    }
  );
}
