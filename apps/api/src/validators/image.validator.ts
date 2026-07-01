import { z } from 'zod';

export const pullImageSchema = z.object({
  fromImage: z.string().min(1, 'Image reference is required'),
  tag: z.string().min(1, 'Tag cannot be empty').default('latest').optional(),
});

export const tagImageSchema = z.object({
  repo: z.string().min(1, 'Repository is required'),
  tag: z.string().min(1, 'Tag cannot be empty').default('latest').optional(),
});

export type PullImageInput = z.infer<typeof pullImageSchema>;
export type TagImageInput = z.infer<typeof tagImageSchema>;
