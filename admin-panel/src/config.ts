// Always use the deployed backend. Falling back to `/api` makes the browser call
// the admin panel server at localhost:3005 instead of the real API deployment.
const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  'https://persistent-backend-database-setup.v0.build/backend-api';

const normalizedApiUrl = configuredApiUrl.startsWith('http')
  ? configuredApiUrl
  : `https://${configuredApiUrl}`;

// Accept either a host that already includes `/api` or the backend deployment
// base, then append `/api` exactly once.
export const API_BASE_URL = normalizedApiUrl.replace(/\/$/, '').endsWith('/api')
  ? normalizedApiUrl.replace(/\/$/, '')
  : `${normalizedApiUrl.replace(/\/$/, '')}/api`;

export const REAL_API_BASE_URL = API_BASE_URL;
