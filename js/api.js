(() => {
  const api = async (endpoint, options = {}) => {
    const response = await fetch(`php/${endpoint}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const payload = await response.json().catch(() => ({ ok: false, error: 'invalid_server_response' }));
    if (!response.ok || payload.ok === false) {
      const error = new Error(payload.error || 'request_failed');
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  api.csrf = async () => {
    const payload = await api('csrf.php');
    return payload.csrf_token;
  };

  api.post = async (endpoint, body) => {
    const token = await api.csrf();
    return api(endpoint, {
      method: 'POST',
      body: JSON.stringify({ ...body, csrf_token: token }),
    });
  };

  window.covoituriniApi = api;
})();
