import { axiosWithCreds } from './axiosInstances';

// Normalises axios errors into { message, status, code, providerHost }.
function toAiError(err) {
  const data = err.response?.data || {};
  const e = new Error(data.error || data.message || 'Something went wrong.');
  e.status = err.response?.status;
  e.code = data.code || (err.response ? undefined : 'NETWORK');
  e.providerHost = data.providerHost;
  if (!err.response) e.message = 'Could not reach the server.';
  return e;
}

async function call(promise) {
  try {
    const { data } = await promise;
    return data;
  } catch (err) {
    throw toAiError(err);
  }
}

export const getAiStatus = () => call(axiosWithCreds.get('/ai/status'));
export const getInsight = (id) => call(axiosWithCreds.get(`/ai/files/${id}`));
export const analyzeFile = (id, { confirmExternal = false } = {}) =>
  call(axiosWithCreds.post(`/ai/files/${id}/analyze`, { confirmExternal }));
export const clearInsight = (id) => call(axiosWithCreds.delete(`/ai/files/${id}`));
export const getInsightsBatch = (fileIds) =>
  call(axiosWithCreds.post('/ai/insights/batch', { fileIds }));
export const smartSearch = (query, { confirmExternal = false } = {}) =>
  call(axiosWithCreds.post('/ai/search', { query, confirmExternal }));
