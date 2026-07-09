import { z } from 'zod';

export const installPluginSchema = z.object({
  remoteName: z.string().min(1, 'Remote name is required'),
  alias: z.string().optional(),
  grantPrivileges: z.boolean().default(false),
  options: z.record(z.string()).optional(),
});

export const configurePluginSchema = z.object({
  env: z.record(z.string()).optional(),
});

export const upgradePluginSchema = z.object({
  remoteName: z.string().min(1, 'Remote name is required'),
  grantPrivileges: z.boolean().default(false),
});

export type InstallPluginInput = z.infer<typeof installPluginSchema>;
export type ConfigurePluginInput = z.infer<typeof configurePluginSchema>;
export type UpgradePluginInput = z.infer<typeof upgradePluginSchema>;
