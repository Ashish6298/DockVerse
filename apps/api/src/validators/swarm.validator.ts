import { z } from 'zod';

export const swarmInitSchema = z.object({
  listenAddr: z.string().optional(),
  advertiseAddr: z.string().optional(),
  dataPathAddr: z.string().optional(),
  forceNewCluster: z.boolean().optional(),
  spec: z.object({
    name: z.string().optional(),
    labels: z.record(z.string()).optional(),
    orchestration: z.object({
      taskHistoryRetentionLimit: z.number().optional(),
    }).optional(),
    raft: z.object({
      snapshotInterval: z.number().optional(),
      keepOldSnapshots: z.number().optional(),
      logEntriesForSlowFollowers: z.number().optional(),
      electionTick: z.number().optional(),
      heartbeatTick: z.number().optional(),
    }).optional(),
    caConfig: z.object({
      nodeCertExpiry: z.number().optional(),
      externalCAs: z.array(z.object({
        protocol: z.string(),
        uRL: z.string(),
        options: z.record(z.string()).optional(),
      })).optional(),
    }).optional(),
    encryptionConfig: z.object({
      autoLockManagers: z.boolean().optional(),
    }).optional(),
    dispatcher: z.object({
      heartbeatPeriod: z.number().optional(),
    }).optional(),
  }).optional(),
});

export const swarmJoinSchema = z.object({
  listenAddr: z.string().optional(),
  advertiseAddr: z.string().optional(),
  dataPathAddr: z.string().optional(),
  remoteAddrs: z.array(z.string()).min(1, 'At least one remote manager address is required'),
  joinToken: z.string().min(1, 'Join token is required'),
});

export const swarmLeaveSchema = z.object({
  force: z.boolean().optional(),
});

export const swarmUpdateSchema = z.object({
  version: z.number({ required_error: 'Version index is required for optimistic locking' }),
  spec: swarmInitSchema.shape.spec,
});

export type SwarmInitInput = z.infer<typeof swarmInitSchema>;
export type SwarmJoinInput = z.infer<typeof swarmJoinSchema>;
export type SwarmLeaveInput = z.infer<typeof swarmLeaveSchema>;
export type SwarmUpdateInput = z.infer<typeof swarmUpdateSchema>;
