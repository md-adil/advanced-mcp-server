import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { wrapAsTextResponse } from "../utils/tools.ts";
import { sendEmail, getCurrentUserEmail } from "./handler.ts";

export function commModule(server: McpServer) {
  server.registerTool(
    "send_email",
    {
      description:
        "Send an email using Azure/Office 365 via Microsoft Graph API",
      inputSchema: {
        to: z
          .array(z.string().email())
          .describe("Array of recipient email addresses"),
        cc: z
          .array(z.string().email())
          .optional()
          .describe("Array of CC email addresses"),
        bcc: z
          .array(z.string().email())
          .optional()
          .describe("Array of BCC email addresses"),
        subject: z.string().describe("Email subject"),
        body: z.string().describe("Email body content"),
        isHtml: z
          .boolean()
          .optional()
          .describe("Whether the body is HTML (default: false)"),
      },
    },
    async (args) => {
      const emailRequest: import("./types.ts").EmailRequest = {
        to: args.to,
        subject: args.subject,
        body: args.body,
        isHtml: args.isHtml ?? false,
      };

      if (args.cc !== undefined) {
        emailRequest.cc = args.cc;
      }

      if (args.bcc !== undefined) {
        emailRequest.bcc = args.bcc;
      }

      const result = await sendEmail(emailRequest);
      return wrapAsTextResponse(result);
    }
  );

  server.registerTool(
    "get_current_user_email",
    {
      description: "Get the current user's email address from Azure CLI",
      inputSchema: {},
    },
    async () => {
      try {
        const email = await getCurrentUserEmail();
        return wrapAsTextResponse({ email });
      } catch (error) {
        return wrapAsTextResponse({ error: String(error) });
      }
    }
  );
}
