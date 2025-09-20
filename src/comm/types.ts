export interface TokenInfo {
  accessToken: string;
  expiresOn: string;
  expires_on: number;
  subscription: string;
  tenant: string;
  tokenType: string;
}
export interface EmailConfig {
  username?: string | undefined;
  tenantId?: string | undefined;
  clientId?: string | undefined;
}

export interface EmailRequest {
  to: string[];
  cc?: string[] | undefined;
  bcc?: string[] | undefined;
  subject: string;
  body: string;
  isHtml?: boolean | undefined;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

export interface AzureGraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
}
