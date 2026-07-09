import { z } from 'zod';

export const eventScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  target: z.enum(['all', 'containers', 'images', 'system']),
  enabled: z.boolean().default(true),
});

export const eventFilterSchema = z.object({
  severity: z.enum(['info', 'warning', 'error']).optional(),
  resourceType: z.enum(['container', 'image', 'volume', 'network', 'stack', 'secret', 'config', 'system']).optional(),
  searchTerm: z.string().optional(),
});

export type EventScheduleInput = z.infer<typeof eventScheduleSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
