import { z } from 'zod';

export const backupCreateSchema = z.object({
  name: z.string().min(1, 'Backup name is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Backup name contains invalid characters'),
  type: z.enum(['full', 'incremental', 'selective']),
  resources: z.object({
    containers: z.array(z.string()).default([]),
    volumes: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    networks: z.array(z.string()).default([]),
    stacks: z.array(z.string()).default([]),
    secrets: z.array(z.string()).default([]),
    configs: z.array(z.string()).default([]),
  }).default({}),
});

export const backupScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  target: z.enum(['full', 'incremental', 'selective']),
  enabled: z.boolean().default(true),
  retentionPolicy: z.object({
    maxBackups: z.number().int().min(1).default(10),
    maxAgeDays: z.number().int().min(1).default(30),
  }).default({}),
});

export type BackupCreateInput = z.infer<typeof backupCreateSchema>;
export type BackupScheduleInput = z.infer<typeof backupScheduleSchema>;
