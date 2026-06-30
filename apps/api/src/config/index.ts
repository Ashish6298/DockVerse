import dotenv from 'dotenv';
import path from 'path';
import { validateConfig } from '@dockverse/config';
import logger from '../utils/logger.js';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

let validatedConfig;
try {
  validatedConfig = validateConfig(process.env);
} catch (error) {
  logger.error({ err: error }, 'Configuration validation failed. Exiting...');
  process.exit(1);
}

export const config = validatedConfig;
export default config;
