import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const axiosWithCreds = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosWithoutCreds = axios.create({
  baseURL: BASE_URL,
});

// If the API proxy is misconfigured, Vercel answers with the app's index.html
// (HTTP 200) instead of JSON. Fail loudly instead of crashing on undefined data.
const rejectHtmlResponses = (response) => {
  const type = response.headers?.['content-type'] || '';
  if (type.includes('text/html') && response.config?.responseType !== 'text') {
    const err = new Error('API returned a web page instead of JSON');
    err.response = { ...response, status: 502 };
    return Promise.reject(err);
  }
  return response;
};
axiosWithCreds.interceptors.response.use(rejectHtmlResponses);
axiosWithoutCreds.interceptors.response.use(rejectHtmlResponses);
