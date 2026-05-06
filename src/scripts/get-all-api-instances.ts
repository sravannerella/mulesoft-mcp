import type { AppContainer } from '../container.js';
import { discoverTopology } from './discovery.shared.js';

export async function executeGetAllApiInstances(
  container: AppContainer,
  environment?: string,
): Promise<unknown> {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const dataset = await discoverTopology(container, { environment: normalizedEnvironment });

  return {
    summary: {
      environmentsScanned: dataset.environmentsScanned.length,
      apiInstancesFound: dataset.apiInstances.length,
      mappedInstances: dataset.apiInstances.filter((instance) => instance.associationStatus === 'mapped').length,
      unmappedInstances: dataset.apiInstances.filter((instance) => instance.associationStatus === 'unmapped').length,
      errors: dataset.errors.length,
    },
    environmentFilter: normalizedEnvironment ?? null,
    apiInstances: dataset.apiInstances,
    errors: dataset.errors,
  };
}

function normalizeEnvironment(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}