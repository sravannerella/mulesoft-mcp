import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        devFormat,
      ),
    }),
  ],
});

/** Strip credential values from a CLI argument list before logging. */
export function sanitizeArgs(args: string[]): string[] {
  const redactNext = new Set([
    '--password',
    '--client_secret',
    '--client-secret',
    '--token',
  ]);
  return args.map((arg, i) =>
    i > 0 && redactNext.has(args[i - 1] ?? '') ? '***' : arg,
  );
}
