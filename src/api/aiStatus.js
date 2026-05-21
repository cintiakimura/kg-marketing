/**
 * Check whether the backend has Grok configured (live AI vs demo).
 */

function getBackendApiUrl() {
  const envUrl =
    import.meta.env.VITE_KG_MARKETING_API_URL || import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * @returns {Promise<{ grokConfigured: boolean, message: string, model?: string }>}
 */
export async function fetchAiStatus() {
  const base = getBackendApiUrl();
  if (!base) {
    return {
      grokConfigured: false,
      message: 'Set VITE_KG_MARKETING_API_URL to your API (e.g. https://your-api.onrender.com) and rebuild.',
    };
  }

  try {
    const res = await fetch(`${base}/api/ai/status`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        grokConfigured: false,
        message: json.error || `Could not reach AI status (${res.status})`,
      };
    }
    return {
      grokConfigured: Boolean(json.data?.grok_configured),
      message: json.data?.message || '',
      model: json.data?.model,
    };
  } catch (err) {
    return {
      grokConfigured: false,
      message: err.message || 'Could not reach backend',
    };
  }
}
