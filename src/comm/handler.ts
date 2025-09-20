import { logger } from "../logger/index.ts";
import { EmailRequest, EmailResponse } from "./types.ts";
import { getAccessToken } from "./cli.ts";
import { getCurrentUser } from "../azure/cli.ts";

export async function sendEmail(request: EmailRequest): Promise<EmailResponse> {
  try {
    logger.info("Sending email", { to: request.to, subject: request.subject });

    // Get current user info and access token
    const [user, tokenInfo] = await Promise.all([
      getCurrentUser(),
      getAccessToken(),
    ]);

    const userEmail = user.email;
    if (!userEmail) {
      throw new Error("Could not determine user email from Azure CLI");
    }

    // Prepare the email message for Microsoft Graph API
    const message = {
      message: {
        subject: request.subject,
        body: {
          contentType: request.isHtml ? "HTML" : "Text",
          content: request.body,
        },
        toRecipients: request.to.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
        ccRecipients:
          request.cc?.map((email) => ({
            emailAddress: {
              address: email,
            },
          })) || [],
        bccRecipients:
          request.bcc?.map((email) => ({
            emailAddress: {
              address: email,
            },
          })) || [],
      },
    };

    // Send email using Microsoft Graph API via HTTP request
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenInfo.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // If we get access denied, provide helpful error message
      if (response.status === 403 && errorText.includes("ErrorAccessDenied")) {
        throw new Error(
          "Access denied: The Azure CLI token does not have Mail.Send permissions. " +
          "To fix this, you need to either: " +
          "1. Request your IT admin to grant Mail.Send permissions to Azure CLI, or " +
          "2. Use an app registration with proper permissions, or " +
          "3. Use a different email service."
        );
      }

      throw new Error(
        `Graph API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    logger.info("Email sent successfully");
    const messageId = response.headers.get("x-ms-request-id");
    return {
      success: true,
      messageId: messageId ?? undefined,
    };
  } catch (error) {
    logger.error("Failed to send email", { error: String(error) });
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function getCurrentUserEmail(): Promise<string> {
  try {
    const user = await getCurrentUser();
    const userEmail = user.email;

    if (!userEmail) {
      throw new Error("Could not determine user email from Azure CLI");
    }

    return userEmail;
  } catch (error) {
    logger.error("Failed to get current user email", { error: String(error) });
    throw error;
  }
}
