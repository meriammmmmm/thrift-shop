// Use the deployed backend directly. The admin panel must not proxy API calls
// through localhost when it is opened from a separate admin deployment.
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';

// Every admin request must go directly to the deployed backend. Never fall back
// to the admin panel's local /api proxy, which causes localhost:3005 requests.
export const API_BASE_URL = configuredApiUrl
  ? `${configuredApiUrl.startsWith('http') ? configuredApiUrl : `https://${configuredApiUrl}`}`.replace(/\/$/, '') + '/api'
  : '';

export const REAL_API_BASE_URL = API_BASE_URL;
