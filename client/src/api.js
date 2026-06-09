/* ============================================================
   api.js — centralised fetch wrapper for all backend calls
   All routes go through /api (Vite proxies to localhost:3000)
   ============================================================ */

const BASE = '/api';

/** Returns the stored JWT or null */
function getToken() {
  return localStorage.getItem('mm_token');
}

/** Builds headers — adds Authorization when token is present */
function buildHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/** Core fetch wrapper — throws on non-2xx */
async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return json;
}

export const authApi = {
  /** POST /api/auth/login */
  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),

  /** GET /api/auth/me */
  me: () => request('GET', '/auth/me'),
};

export const customersApi = {
  /**
   * GET /api/customers
   * Params: { search, gender, city, religion, journey_status,
   *           marital_status, page, limit, sort }
   */
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
    ).toString();
    return request('GET', `/customers${q ? '?' + q : ''}`);
  },

  /** GET /api/customers/:id */
  get: (id) => request('GET', `/customers/${id}`),

  /** PUT /api/customers/:id */
  update: (id, data) => request('PUT', `/customers/${id}`, data),

  /** PATCH /api/customers/:id/journey */
  updateJourney: (id, status, note) =>
    request('PATCH', `/customers/${id}/journey`, { status, note }),

  /** GET /api/customers/:id/journey-events */
  journeyEvents: (id) => request('GET', `/customers/${id}/journey-events`),

  /** GET /api/customers/:id/sent-matches */
  sentMatches: (id) => request('GET', `/customers/${id}/sent-matches`),
};

export const matchesApi = {
  /**
   * GET /api/customers/:id/matches
   * Returns ranked candidates from the match engine
   */
  getMatches: (customerId) =>
    request('GET', `/customers/${customerId}/matches`),

  /**
   * POST /api/customers/:id/matches/:matchId/send
   * Marks the match as Sent in the DB
   */
  sendMatch: (customerId, matchId, score) =>
    request('POST', `/customers/${customerId}/matches/${matchId}/send`, { score }),
};

export const notesApi = {
  /** GET /api/customers/:id/notes */
  list: (customerId) => request('GET', `/customers/${customerId}/notes`),

  /** POST /api/customers/:id/notes */
  add: (customerId, note_type, content) =>
    request('POST', `/customers/${customerId}/notes`, { note_type, content }),

  /** DELETE /api/notes/:noteId */
  delete: (noteId) => request('DELETE', `/notes/${noteId}`),
};
