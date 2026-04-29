import { env } from './config/env.js';
import { CLIService } from './cli/cli-service.js';
import { RateLimiter } from './utils/rate-limiter.js';
import { DesignCenterService } from './services/design-center.service.js';
import { RuntimeManagerService } from './services/runtime-manager.service.js';
import { ExchangeService } from './services/exchange.service.js';
import { ApiManagerService } from './services/api-manager.service.js';
import { AccountService } from './services/account.service.js';

export interface AppContainer {
  cli: CLIService;
  designCenter: DesignCenterService;
  runtimeManager: RuntimeManagerService;
  exchange: ExchangeService;
  apiManager: ApiManagerService;
  account: AccountService;
}

export function createContainer(): AppContainer {
  const rateLimiter = new RateLimiter(env.RATE_LIMIT_RPS);
  const cli = new CLIService(
    { timeoutMs: env.CLI_TIMEOUT_MS, maxRetries: env.CLI_MAX_RETRIES },
    rateLimiter,
  );

  return {
    cli,
    designCenter: new DesignCenterService(cli),
    runtimeManager: new RuntimeManagerService(cli),
    exchange: new ExchangeService(cli),
    apiManager: new ApiManagerService(cli),
    account: new AccountService(cli),
  };
}
