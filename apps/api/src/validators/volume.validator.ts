import { z } from 'zod';

export const createVolumeSchema = z.object({
  name: z.string().min(1, 'Volume name is required'),
  driver: z.string().min(1, 'Driver name is required').default('local').optional(),
  driverOpts: z.record(z.string()).optional(),
  labels: z.record(z.string()).optional(),
});

export type CreateVolumeInput = z.infer<typeof createVolumeSchema>;
