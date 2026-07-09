import { z } from 'zod';

export const stackDeploySchema = z.object({
  name: z.string().min(1, 'Stack name is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Stack name contains invalid characters'),
  content: z.string().min(1, 'Compose template content is required'),
  env: z.record(z.string()).optional(),
});

export const stackScaleSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  replicas: z.number().int().min(0, 'Replicas must be a non-negative integer'),
});

export const stackUpdateSchema = z.object({
  content: z.string().min(1, 'Updated Compose template is required'),
});

export type StackDeployInput = z.infer<typeof stackDeploySchema>;
export type StackScaleInput = z.infer<typeof stackScaleSchema>;
export type StackUpdateInput = z.infer<typeof stackUpdateSchema>;
