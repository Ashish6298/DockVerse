import { z } from 'zod';

export const createContainerSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  image: z.string().min(1, 'Image is required'),
  cmd: z.union([z.string(), z.array(z.string())]).optional(),
  ports: z.array(
    z.object({
      hostPort: z.coerce.number().min(1).max(65535),
      containerPort: z.coerce.number().min(1).max(65535),
    })
  ).optional(),
  env: z.array(z.string()).optional(),
});

export const renameContainerSchema = z.object({
  name: z.string().min(1, 'New name is required'),
});

export const containerLogsSchema = z.object({
  tail: z.coerce.number().min(1).default(100).optional(),
  timestamps: z.coerce.boolean().default(true).optional(),
});

export type CreateContainerInput = z.infer<typeof createContainerSchema>;
export type RenameContainerInput = z.infer<typeof renameContainerSchema>;
