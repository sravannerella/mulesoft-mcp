import type { AppContainer } from '../container.js';
import { formatError, type FormattedError } from '../utils/errors.js';
import type {
  ApiManagerApi,
  ApiPolicy,
  Application,
  CloudHub2Deployment,
  Environment,
  RuntimeApplication,
} from '../types/index.js';

export type DeploymentKind = 'on-prem' | 'cloudhub-1.0' | 'cloudhub-2.0';
export type AssociationStatus = 'mapped' | 'unmapped';
export type PolicyStatus = 'applied' | 'none' | 'unknown';

export interface DiscoveryError {
  scope: string;
  error: string;
  type: string;
  details?: unknown;
}

export interface AssociatedApplicationRef {
  name: string;
  environment: string;
  deploymentType: DeploymentKind;
}

export interface AssociatedApiInstanceRef {
  id: string;
  name: string;
  environment: string;
}

export interface ApplicationInventoryItem {
  name: string;
  environment: string;
  deploymentType: DeploymentKind;
  status?: string;
  domain?: string;
  target?: string;
  runtimeVersion?: string;
  lastUpdateTime?: string;
  associatedApiInstances: AssociatedApiInstanceRef[];
  associationStatus: AssociationStatus;
}

export interface ApiInstanceInventoryItem {
  id: string;
  name: string;
  environment: string;
  assetId?: string;
  autodiscoveryInstanceName?: string;
  endpointUri?: string;
  proxyUri?: string;
  associatedApplications: AssociatedApplicationRef[];
  associationStatus: AssociationStatus;
  policyCount?: number | null;
  hasPolicies?: boolean | null;
  policyStatus?: PolicyStatus;
}

export interface DiscoveryDataset {
  environmentsScanned: string[];
  applications: ApplicationInventoryItem[];
  apiInstances: ApiInstanceInventoryItem[];
  errors: DiscoveryError[];
}

interface DiscoveryOptions {
  environment?: string;
  includePolicies?: boolean;
}

interface NormalizedApplication {
  name: string;
  environment: string;
  deploymentType: DeploymentKind;
  status?: string;
  domain?: string;
  target?: string;
  runtimeVersion?: string;
  lastUpdateTime?: string;
}

interface ApiWithEnvironment {
  api: ApiManagerApi;
  environment: string;
}

interface PolicySummary {
  count: number | null;
  hasPolicies: boolean | null;
  status: PolicyStatus;
}

export async function discoverTopology(
  container: AppContainer,
  options: DiscoveryOptions = {},
): Promise<DiscoveryDataset> {
  const errors: DiscoveryError[] = [];
  const environments = await resolveEnvironments(container, options.environment, errors);

  if (environments.length === 0) {
    return {
      environmentsScanned: [],
      applications: [],
      apiInstances: [],
      errors,
    };
  }

  const allApplications: NormalizedApplication[] = [];
  const allApis: ApiWithEnvironment[] = [];

  for (const environment of environments) {
    const environmentName = environment.name;

    const standaloneApps = await listStandaloneApplications(container, environmentName, errors);
    for (const app of standaloneApps) {
      allApplications.push({
        name: app.name,
        environment: environmentName,
        deploymentType: 'on-prem',
        status: app.status,
        target: app.target,
        runtimeVersion: app.muleVersion,
        lastUpdateTime: app.lastUpdateTime,
      });
    }

    const cloudHubApps = await safeExecute(
      errors,
      `${environmentName}:runtime-manager:cloudhub-1.0`,
      () => container.runtimeManager.listCloudHubApplications(environmentName),
    );
    for (const app of cloudHubApps ?? []) {
      allApplications.push(normalizeCloudHubApplication(app, environmentName));
    }

    const cloudHub2Apps = await safeExecute(
      errors,
      `${environmentName}:runtime-manager:cloudhub-2.0`,
      () => container.runtimeManager.listCloudHub2Deployments(undefined, environmentName),
    );
    for (const app of cloudHub2Apps ?? []) {
      allApplications.push(normalizeCloudHub2Deployment(app, environmentName));
    }

    const apis = await safeExecute(
      errors,
      `${environmentName}:api-manager:instances`,
      () => container.apiManager.listApis(environmentName),
    );
    for (const api of apis ?? []) {
      allApis.push({ api, environment: environmentName });
    }
  }

  const applicationIndex = new Map<string, Set<number>>();
  allApplications.forEach((application, index) => {
    for (const key of collectApplicationKeys(application)) {
      const existing = applicationIndex.get(key) ?? new Set<number>();
      existing.add(index);
      applicationIndex.set(key, existing);
    }
  });

  const appToApis = new Map<number, AssociatedApiInstanceRef[]>();
  const apiInstances: ApiInstanceInventoryItem[] = [];

  for (const { api, environment } of allApis) {
    const matchedIndices = new Set<number>();
    for (const key of collectApiKeys(api)) {
      for (const index of applicationIndex.get(key) ?? []) matchedIndices.add(index);
    }

    const associatedApplications = [...matchedIndices]
      .map((index) => allApplications[index])
      .filter((application): application is NormalizedApplication => application !== undefined)
      .map((application) => ({
        name: application.name,
        environment: application.environment,
        deploymentType: application.deploymentType,
      }));

    const apiId = String(api.id);
    const apiName = api.name?.trim() || api.autodiscoveryInstanceName?.trim() || api.assetId?.trim() || apiId;

    let policySummary: PolicySummary | undefined;
    if (options.includePolicies) {
      policySummary = await getPolicySummary(container, apiId, environment, errors);
    }

    const apiRef: AssociatedApiInstanceRef = {
      id: apiId,
      name: apiName,
      environment,
    };

    for (const index of matchedIndices) {
      const existing = appToApis.get(index) ?? [];
      existing.push(apiRef);
      appToApis.set(index, existing);
    }

    apiInstances.push({
      id: apiId,
      name: apiName,
      environment,
      assetId: api.assetId,
      autodiscoveryInstanceName: api.autodiscoveryInstanceName,
      endpointUri: api.endpoint?.uri,
      proxyUri: api.endpoint?.proxyUri,
      associatedApplications,
      associationStatus: associatedApplications.length > 0 ? 'mapped' : 'unmapped',
      policyCount: policySummary?.count,
      hasPolicies: policySummary?.hasPolicies,
      policyStatus: policySummary?.status,
    });
  }

  const applications: ApplicationInventoryItem[] = allApplications.map((application, index) => {
    const associatedApiInstances = appToApis.get(index) ?? [];
    return {
      ...application,
      associatedApiInstances,
      associationStatus: associatedApiInstances.length > 0 ? 'mapped' : 'unmapped',
    };
  });

  return {
    environmentsScanned: environments.map((environment) => environment.name),
    applications,
    apiInstances,
    errors,
  };
}

async function resolveEnvironments(
  container: AppContainer,
  environment: string | undefined,
  errors: DiscoveryError[],
): Promise<Environment[]> {
  if (environment) {
    return [{ id: environment, name: environment, type: 'filtered' }];
  }

  return (await safeExecute(errors, 'account:environments', () => container.account.listEnvironments())) ?? [];
}

async function listStandaloneApplications(
  container: AppContainer,
  environment: string,
  errors: DiscoveryError[],
): Promise<RuntimeApplication[]> {
  const pageSize = 200;
  const applications: RuntimeApplication[] = [];
  let offset = 0;

  while (true) {
    const page = await safeExecute(
      errors,
      `${environment}:runtime-manager:on-prem:${offset}`,
      () => container.runtimeManager.listApplications(pageSize, offset, undefined, environment),
    );

    if (!page || page.length === 0) break;

    applications.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return applications;
}

async function getPolicySummary(
  container: AppContainer,
  apiId: string,
  environment: string,
  errors: DiscoveryError[],
): Promise<PolicySummary> {
  const policies = await safeExecute(
    errors,
    `${environment}:api-manager:policies:${apiId}`,
    () => container.apiManager.listPolicies(apiId, environment),
  );

  if (!policies) {
    return { count: null, hasPolicies: null, status: 'unknown' };
  }

  const activePolicies = policies.filter((policy) => policy.disabled !== true);
  return {
    count: activePolicies.length,
    hasPolicies: activePolicies.length > 0,
    status: activePolicies.length > 0 ? 'applied' : 'none',
  };
}

async function safeExecute<T>(
  errors: DiscoveryError[],
  scope: string,
  operation: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    errors.push(toDiscoveryError(scope, formatError(error)));
    return undefined;
  }
}

function toDiscoveryError(scope: string, error: FormattedError): DiscoveryError {
  return {
    scope,
    error: error.error,
    type: error.type,
    details: error.details,
  };
}

function normalizeCloudHubApplication(application: Application, environment: string): NormalizedApplication {
  return {
    name: application.name,
    environment,
    deploymentType: 'cloudhub-1.0',
    status: application.status,
    domain: application.domain,
    runtimeVersion: application.muleVersion,
    lastUpdateTime: application.lastUpdateTime,
  };
}

function normalizeCloudHub2Deployment(application: CloudHub2Deployment, environment: string): NormalizedApplication {
  return {
    name: application.name,
    environment,
    deploymentType: 'cloudhub-2.0',
    status: application.status,
    target: application.target,
    runtimeVersion: application.runtimeVersion,
    lastUpdateTime: application.lastModifiedDate,
  };
}

function collectApplicationKeys(application: NormalizedApplication): string[] {
  const keys = new Set<string>();
  addKey(keys, application.name);
  addKey(keys, application.domain);
  addHostKeys(keys, application.domain);
  return [...keys];
}

function collectApiKeys(api: ApiManagerApi): string[] {
  const keys = new Set<string>();
  addKey(keys, api.name);
  addKey(keys, api.autodiscoveryInstanceName);
  addKey(keys, api.assetId);
  addKey(keys, api.endpoint?.uri);
  addKey(keys, api.endpoint?.proxyUri);
  addHostKeys(keys, api.endpoint?.uri);
  addHostKeys(keys, api.endpoint?.proxyUri);
  return [...keys];
}

function addHostKeys(keys: Set<string>, value: string | undefined): void {
  if (!value) return;

  const parsedHost = parseHost(value);
  if (!parsedHost) return;

  addKey(keys, parsedHost);
  const firstLabel = parsedHost.split('.')[0];
  if (firstLabel) addKey(keys, firstLabel);
}

function parseHost(value: string): string | undefined {
  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`);
    return url.hostname;
  } catch {
    return undefined;
  }
}

function addKey(keys: Set<string>, value: string | undefined): void {
  const normalized = normalizeKey(value);
  if (normalized) keys.add(normalized);
}

function normalizeKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized || undefined;
}