import { z } from 'zod';

export const securityScanSchema = z.object({
  targetType: z.enum(['container', 'image', 'system']),
  targetId: z.string().min(1, 'Target ID is required'),
  category: z.enum(['vulnerability', 'compliance', 'hardening']).default('vulnerability'),
});

export const securityScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  target: z.enum(['all', 'containers', 'images', 'compliance']),
  enabled: z.boolean().default(true),
});

export type SecurityScanInput = z.infer<typeof securityScanSchema>;
export type SecurityScheduleInput = z.infer<typeof securityScheduleSchema>;
