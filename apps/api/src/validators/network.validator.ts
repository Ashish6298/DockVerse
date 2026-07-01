import { z } from 'zod';

export const createNetworkSchema = z.object({
  name: z.string().min(1, 'Network name is required'),
  driver: z.string().min(1, 'Driver name is required').default('bridge').optional(),
  attachable: z.coerce.boolean().default(true).optional(),
  internal: z.coerce.boolean().default(false).optional(),
  enableIPv6: z.coerce.boolean().default(false).optional(),
  subnet: z.string().optional(),
  gateway: z.string().optional(),
});

export const connectContainerSchema = z.object({
  container: z.string().min(1, 'Container ID or name is required'),
});

export const disconnectContainerSchema = z.object({
  container: z.string().min(1, 'Container ID or name is required'),
  force: z.coerce.boolean().default(false).optional(),
});

export type CreateNetworkInput = z.infer<typeof createNetworkSchema>;
export type ConnectContainerInput = z.infer<typeof connectContainerSchema>;
export type DisconnectContainerInput = z.infer<typeof disconnectContainerSchema>;
