import { z } from 'zod';

export const validateDockerfileSchema = z.object({
  content: z.string().min(1, 'Dockerfile content is required'),
});

export const analyzeDockerfileSchema = z.object({
  content: z.string().min(1, 'Dockerfile content is required'),
});

export const buildDockerfileSchema = z.object({
  name: z.string().min(1, 'Image name is required'),
  tag: z.string().min(1, 'Tag is required').default('latest').optional(),
  content: z.string().min(1, 'Dockerfile content is required'),
  buildArgs: z.record(z.string()).optional(),
});

export type ValidateDockerfileInput = z.infer<typeof validateDockerfileSchema>;
export type AnalyzeDockerfileInput = z.infer<typeof analyzeDockerfileSchema>;
export type BuildDockerfileInput = z.infer<typeof buildDockerfileSchema>;
