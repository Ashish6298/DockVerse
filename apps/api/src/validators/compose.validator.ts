import { z } from 'zod';

export const validateComposeSchema = z.object({
  content: z.string().min(1, 'Compose content is required'),
});

export const runComposeCommandSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  content: z.string().min(1, 'Compose content is required'),
});

export type ValidateComposeInput = z.infer<typeof validateComposeSchema>;
export type RunComposeCommandInput = z.infer<typeof runComposeCommandSchema>;
