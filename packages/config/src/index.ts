import { z } from 'zod';

export const configSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DOCKER_SOCKET_PATH: z.string().optional(),
  DOCKER_HOST: z.string().optional(),
  DOCKER_PORT: z.coerce.number().optional(),
  MONGO_URI: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Config = z.infer<typeof configSchema>;

export function validateConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error('❌ Invalid environment variables:', JSON.stringify(formattedErrors, null, 2));
    throw new Error('Invalid configuration');
  }
  return result.data;
}
