import type { AppContainer } from '../container.js';
import { discoverTopology } from './discovery.shared.js';

export async function executeListAllApplications(
  container: AppContainer,
  environment?: string,
): Promise<unknown> {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const dataset = await discoverTopology(container, { environment: normalizedEnvironment });

  return {
    summary: {
      environmentsScanned: dataset.environmentsScanned.length,
      applicationsFound: dataset.applications.length,
      mappedApplications: dataset.applications.filter((application) => application.associationStatus === 'mapped').length,
      unmappedApplications: dataset.applications.filter((application) => application.associationStatus === 'unmapped').length,
      errors: dataset.errors.length,
    },
    environmentFilter: normalizedEnvironment ?? null,
    applications: dataset.applications,
    errors: dataset.errors,
  };
}

function normalizeEnvironment(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}