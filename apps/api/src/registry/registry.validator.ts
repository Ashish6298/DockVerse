import { z } from 'zod';

export const registryLoginSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  url: z.string().url('Invalid registry URL').optional(),
});

export const registrySearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

export const registryPullPushSchema = z.object({
  imageName: z.string().min(1, 'Image name is required'),
  tag: z.string().min(1, 'Tag is required').default('latest').optional(),
});

export type RegistryLoginInput = z.infer<typeof registryLoginSchema>;
export type RegistrySearchInput = z.infer<typeof registrySearchSchema>;
export type RegistryPullPushInput = z.infer<typeof registryPullPushSchema>;
