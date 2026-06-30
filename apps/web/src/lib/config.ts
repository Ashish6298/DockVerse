/**
 * Centralized Application Configuration for DockVerse Web Frontend
 */
export const APP_CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api/v1',
  REST_POLLING_INTERVAL_MS: 5000, // Background polling interval for dashboard stats
  DEFAULT_THEME: 'dark' as const,
};

export default APP_CONFIG;
