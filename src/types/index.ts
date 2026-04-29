// ─── Shared entity types returned by the Anypoint CLI (JSON output) ──────────

export interface Application {
  name: string;
  status: string;
  domain?: string;
  workers?: number;
  workerSize?: string;
  region?: string;
  muleVersion?: string;
  lastUpdateTime?: string;
  deploymentId?: string;
}

export interface RuntimeApplication {
  name: string;
  status: string;
  type?: string;
  target?: string;
  lastUpdateTime?: string;
  muleVersion?: string;
}

export interface Server {
  name: string;
  status: string;
  type: string;
  muleVersion?: string;
  agentVersion?: string;
  addresses?: string[];
}

export interface Cluster {
  name: string;
  status: string;
  servers?: string[];
  multicastEnabled?: boolean;
}

export interface DesignCenterProject {
  id: string;
  name: string;
  type: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface ExchangeAsset {
  groupId: string;
  assetId: string;
  version: string;
  name: string;
  type: string;
  status?: string;
  description?: string;
  tags?: string[];
}

export interface ApiManagerApi {
  id: string | number;
  assetId?: string;
  name?: string;
  type?: string;
  activeContractsCount?: number;
  autodiscoveryInstanceName?: string;
  endpoint?: { uri?: string; proxyUri?: string };
}

export interface ApiPolicy {
  id: string | number;
  policyTemplateId?: string;
  version?: string;
  order?: number;
  disabled?: boolean;
  configuration?: Record<string, unknown>;
}

export interface FlexGateway {
  name: string;
  status: string;
  version?: string;
  tags?: string[];
}

export interface FlexGatewayBinding {
  name: string;
  status?: string;
  apiInstance?: string;
}

export interface Environment {
  id: string;
  name: string;
  type: string;
  isProduction?: boolean;
  clientId?: string;
}

export interface BusinessGroup {
  id: string;
  name: string;
  domain?: string;
  parentId?: string;
}

export interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}

export interface CloudHub2Deployment {
  name: string;
  status: string;
  target?: string;
  replicas?: number;
  runtimeVersion?: string;
  lastModifiedDate?: string;
}

// ─── Deployment input types ───────────────────────────────────────────────────

export interface CloudHubDeployOptions {
  name: string;
  jarPath: string;
  runtimeVersion?: string;
  workers?: number;
  workerSize?: 'Micro' | 'Small' | 'Medium' | 'Large' | 'xLarge' | 'xxLarge' | '4vCores' | '8vCores';
  region?: string;
  properties?: Record<string, string>;
}

export interface CloudHub2DeployOptions {
  name: string;
  /** Exchange artifactId of the application to deploy */
  artifactId: string;
  /** Deployment target ID (Shared Space or Private Space) */
  target: string;
  runtimeVersion?: string;
  replicas?: number;
  /** Replica size in vCores, e.g. "0.1", "0.5", "1" */
  replicaSize?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}
