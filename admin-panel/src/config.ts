// Use the deployed backend directly. The admin panel must not proxy API calls
// through localhost when it is opened from a separate admin deployment.
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';

export const API_BASE_URL = configuredApiUrl
  ? `${configuredApiUrl.startsWith('http') ? configuredApiUrl : `https://${configuredApiUrl}`}`.replace(/\/$/, '') + '/api'
  : '/api';
