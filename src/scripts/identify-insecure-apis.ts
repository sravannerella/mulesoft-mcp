import type { AppContainer } from '../container.js';
import { discoverTopology } from './discovery.shared.js';

export async function executeIdentifyInsecureApis(
  container: AppContainer,
  environment?: string,
): Promise<unknown> {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const dataset = await discoverTopology(container, {
    environment: normalizedEnvironment,
    includePolicies: true,
  });
  const insecureInstances = dataset.apiInstances.filter((instance) => instance.policyStatus === 'none');

  return {
    summary: {
      environmentsScanned: dataset.environmentsScanned.length,
      apiInstancesEvaluated: dataset.apiInstances.length,
      insecureInstancesFound: insecureInstances.length,
      secureInstancesFound: dataset.apiInstances.filter((instance) => instance.policyStatus === 'applied').length,
      instancesWithUnknownPolicyState: dataset.apiInstances.filter((instance) => instance.policyStatus === 'unknown').length,
      errors: dataset.errors.length,
    },
    environmentFilter: normalizedEnvironment ?? null,
    insecureApiInstances: insecureInstances,
    errors: dataset.errors,
  };
}

function normalizeEnvironment(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}