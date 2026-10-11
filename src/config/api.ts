// Single source of the backend host for all app requests; scripts/preflight.ts keeps its own literal (Node type-stripping cannot import it), guarded by __tests__/api-host-guard.test.ts.
export const API_BASE_URL = "https://portuguese-verb-api-fra.onrender.com";
