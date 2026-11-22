(() => {
  const api = async (endpoint, options = {}) => {
    const timeoutMs = options.timeoutMs || 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let csrfToken = options.csrfToken || '';
      if ((options.method || 'GET').toUpperCase() !== 'GET' && !csrfToken) {
        const csrfResponse = await api('csrf.php');
        if (!csrfResponse.ok) {
          return { ok: false, data: null, error: 'invalid_csrf_token', status: 419 };
        }
        csrfToken = csrfResponse.data.csrf_token;
      }
      const headers = {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...(options.headers || {}),
      };
      const response = await fetch(`php/${endpoint}`, {
        credentials: 'same-origin',
        ...options,
        headers,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!payload) {
        return { ok: false, data: null, error: 'invalid_server_response', status: response.status };
      }
      if (!response.ok || payload.ok === false) {
        return {
          ok: false,
          data: payload.data ?? null,
          error: payload.error || 'request_failed',
          status: response.status,
        };
      }
      return { ok: true, data: payload, error: null, status: response.status };
    } catch (error) {
      return {
        ok: false,
        data: null,
        error: error.name === 'AbortError' ? 'timeout' : 'network_error',
        status: 0,
      };
    } finally {
      clearTimeout(timer);
    }
  };

  api.post = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body || {}) });

  api.state = (element, state, message) => {
    if (!element) return;
    element.dataset.state = state;
    if (state === 'loading') element.setAttribute('aria-busy', 'true');
    else element.removeAttribute('aria-busy');
    if (message !== undefined) element.dataset.stateMessage = message;
  };

  window.covoituriniApi = api;
})();
