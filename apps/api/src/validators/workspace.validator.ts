import { z } from 'zod';

export const workspaceResourceSchema = z.object({
  type: z.enum(['container', 'image', 'network', 'volume']),
  id: z.string().min(1),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  description: z.string().optional(),
  resources: z.array(workspaceResourceSchema).default([]),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(50, 'Name must be under 50 characters').optional(),
  description: z.string().optional(),
  resources: z.array(workspaceResourceSchema).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
