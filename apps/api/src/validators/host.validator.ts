import { z } from 'zod';

export const hostCreateSchema = z.object({
  name: z.string().min(1, 'Host name identifier is required'),
  displayName: z.string().min(1, 'Friendly display name is required'),
  description: z.string().optional(),
  hostname: z.string().min(1, 'Target hostname or domain is required'),
  ipAddress: z.string().min(1, 'IP address is required'),
  port: z.number().int().default(2375),
  connectionType: z.enum(['socket', 'tcp', 'tls', 'ssh', 'wsl']),
  enabled: z.boolean().default(true),
});

export const hostUpdateSchema = hostCreateSchema.partial();

export type HostCreateInput = z.infer<typeof hostCreateSchema>;
export type HostUpdateInput = z.infer<typeof hostUpdateSchema>;
