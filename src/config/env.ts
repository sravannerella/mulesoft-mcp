import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    // ── Auth ──────────────────────────────────────────────────────────────
    ANYPOINT_USERNAME: z.string().optional(),
    ANYPOINT_PASSWORD: z.string().optional(),
    ANYPOINT_CLIENT_ID: z.string().optional(),
    ANYPOINT_CLIENT_SECRET: z.string().optional(),

    // ── Scope ─────────────────────────────────────────────────────────────
    ANYPOINT_ORG_ID: z.string().min(1, 'ANYPOINT_ORG_ID is required'),
    ANYPOINT_ENV_NAME: z.string().optional(),
    ANYPOINT_ENV_ID: z.string().optional(),

    // ── Optional config ───────────────────────────────────────────────────
    ANYPOINT_HOST: z
      .string()
      .optional()
      .default('anypoint.mulesoft.com')
      // Strip any accidental https:// prefix so the CLI receives only the hostname
      .transform((v) => v.replace(/^https?:\/\//, '').replace(/\/$/, '')),
    CLI_TIMEOUT_MS: z.coerce.number().positive().optional().default(30_000),
    CLI_MAX_RETRIES: z.coerce.number().min(0).max(10).optional().default(3),
    RATE_LIMIT_RPS: z.coerce.number().positive().optional().default(10),
    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'debug'])
      .optional()
      .default('info'),
    CACHE_TTL_SECONDS: z.coerce.number().positive().optional().default(300),
  })
  .refine(
    (d) =>
      (!!d.ANYPOINT_USERNAME && !!d.ANYPOINT_PASSWORD) ||
      (!!d.ANYPOINT_CLIENT_ID && !!d.ANYPOINT_CLIENT_SECRET),
    {
      message:
        'Provide either (ANYPOINT_USERNAME + ANYPOINT_PASSWORD) or (ANYPOINT_CLIENT_ID + ANYPOINT_CLIENT_SECRET)',
    },
  );

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const { fieldErrors, formErrors } = result.error.flatten();
    const fieldMsg = Object.entries(fieldErrors)
      .map(([k, v]) => `  ${k}: ${v?.join(', ')}`)
      .join('\n');
    const formMsg = formErrors.join('\n');
    throw new Error(
      `Environment validation failed:\n${fieldMsg}${formMsg ? '\n' + formMsg : ''}`,
    );
  }
  return result.data;
}

export const env = validateEnv();
