import { z } from 'zod';

export const policyCreateSchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  description: z.string().min(1, 'Policy description is required'),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string().min(1, 'Policy category is required'),
  targetResourceType: z.enum(['container', 'image', 'network', 'volume', 'stack', 'secret', 'config', 'system']),
  enabled: z.boolean().default(true),
});

export const policyScanSchema = z.object({
  targetResourceType: z.enum(['container', 'image', 'network', 'volume', 'stack', 'secret', 'config', 'system']).optional(),
  targetResourceId: z.string().optional(),
});

export const policyScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  target: z.enum(['all', 'containers', 'images', 'system']),
  enabled: z.boolean().default(true),
});

export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;
export type PolicyScanInput = z.infer<typeof policyScanSchema>;
export type PolicyScheduleInput = z.infer<typeof policyScheduleSchema>;
