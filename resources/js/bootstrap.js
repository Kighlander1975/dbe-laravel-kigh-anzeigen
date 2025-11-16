// resources/js/bootstrap.js

import axios from "axios";

window.axios = axios;

// Standard-Header
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
window.axios.defaults.headers.common["Accept"] = "application/json";

// CSRF-Token: über <meta name="csrf-token">
function getCsrfToken() {
  const fromMeta = document.head.querySelector('meta[name="csrf-token"]');
  return fromMeta?.content || null;
}

const csrf = getCsrfToken();
if (csrf) {
  window.axios.defaults.headers.common["X-CSRF-TOKEN"] = csrf;
} else {
  console.warn(
    '[bootstrap] Kein CSRF-Token gefunden. Füge <meta name="csrf-token" content="{{ csrf_token() }}"> in dein Layout ein.'
  );
}

// Optional: Base-URL aus Meta übernehmen
const apiBaseMeta = document.head.querySelector('meta[name="api-base"]');
if (apiBaseMeta?.content) {
  window.axios.defaults.baseURL = apiBaseMeta.content;
}

// Dev-Logging
if (import.meta.env.DEV) {
  window.axios.interceptors.request.use((config) => {
    console.log("[axios][request]", config.method?.toUpperCase(), config.url, config);
    return config;
  });
  window.axios.interceptors.response.use(
    (res) => {
      console.log("[axios][response]", res.status, res.config.url, res);
      return res;
    },
    (err) => {
      console.warn("[axios][error]", err?.response?.status, err?.config?.url, err);
      return Promise.reject(err);
    }
  );
}
