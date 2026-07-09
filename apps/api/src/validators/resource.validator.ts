import { z } from 'zod';

export const secretCreateSchema = z.object({
  name: z.string().min(1, 'Secret name is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Secret name contains invalid characters'),
  labels: z.record(z.string()).optional(),
  data: z.string().min(1, 'Secret data cannot be empty'),
  isBase64: z.boolean().default(false),
});

export const configCreateSchema = z.object({
  name: z.string().min(1, 'Config name is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Config name contains invalid characters'),
  labels: z.record(z.string()).optional(),
  data: z.string().min(1, 'Config data cannot be empty'),
});

export type SecretCreateInput = z.infer<typeof secretCreateSchema>;
export type ConfigCreateInput = z.infer<typeof configCreateSchema>;
