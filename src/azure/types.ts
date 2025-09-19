export interface User {
  _links: Links;
  descriptor: string;
  directoryAlias: string;
  displayName: string;
  domain: string;
  mailAddress: string;
  metaType: string;
  origin: string;
  originId: string;
  principalName: string;
  subjectKind: string;
  url: string;
}

interface Links {
  avatar: Avatar;
  membershipState: Avatar;
  memberships: Avatar;
  self: Avatar;
  storageKey: Avatar;
}

interface Avatar {
  href: string;
}

export interface LoggedInUser {
  environmentName: string;
  homeTenantId: string;
  id: string;
  isDefault: boolean;
  managedByTenants: ManagedByTenant[];
  name: string;
  state: string;
  tenantDefaultDomain: string;
  tenantDisplayName: string;
  tenantId: string;
  user: _User;
}

interface _User {
  name: string;
  type: string;
}

interface ManagedByTenant {
  tenantId: string;
}

export interface Project {
  abbreviation: null;
  defaultTeamImageUrl: null;
  description: string;
  id: string;
  lastUpdateTime: string;
  name: string;
  revision: number;
  state: string;
  url: string;
  visibility: string;
}
