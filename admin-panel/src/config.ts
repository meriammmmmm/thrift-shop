// API configuration
//
// The admin panel talks to the same backend as the storefront. Every component
// reads `process.env.REACT_APP_API_URL` directly (with this host as the
// fallback); this module is kept as the single place to look up the value.
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';
