import client from './client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const signup = (name, email, password) =>
  client.post('/auth/signup', { name, email, password });

export const login = (email, password) =>
  client.post('/auth/login', { email, password });

// ─── Analyze ──────────────────────────────────────────────────────────────────
/**
 * POST /api/analyze
 *
 * uiLanguage drives output language (en | hi) — never inferred from input text.
 */
export const analyzeText = (content, uiLanguage = 'en') =>
  client.post('/analyze', { type: 'text', content, uiLanguage });

export const analyzeUrl = (url, uiLanguage = 'en') =>
  client.post('/analyze', { type: 'url', content: url, uiLanguage });

export const analyzeImage = (imageFile, uiLanguage = 'en') => {
  const form = new FormData();
  form.append('type', 'image');
  form.append('file', imageFile);
  form.append('uiLanguage', uiLanguage);
  return client.post('/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─── History ──────────────────────────────────────────────────────────────────
export const getHistory = (page = 1) =>
  client.get(`/history?page=${page}`);

export const getHistoryItem = (id) =>
  client.get(`/history/${id}`);

export const deleteHistoryItem = (id) =>
  client.delete(`/history/${id}`);

// ─── Report ───────────────────────────────────────────────────────────────────
export const getReport = (id) =>
  client.get(`/report/${id}`);

export const getReportPdfUrl = (id) =>
  `/api/report/${id}?format=pdf`;

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = () =>
  client.get('/health');
