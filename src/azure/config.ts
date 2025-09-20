export interface AzureConfig {
  organization: string;
  project?: string | undefined;
  pat?: string | undefined;
}

export function createAzureConfig(): AzureConfig {
  const organization =
    Deno.env.get("AZURE_DEVOPS_ORGANIZATION") ?? "https://dev.azure.com/BFHL";
  const project = Deno.env.get("AZURE_DEVOPS_PROJECT") ?? "eBH";
  const pat = Deno.env.get("AZURE_DEVOPS_PAT");

  return {
    organization,
    project,
    pat,
  };
}
