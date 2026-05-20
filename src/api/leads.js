import { apiRequest } from '@/lib/apiClient';

/**
 * @param {string} [sort]
 */
export async function listLeads(sort = '-created_date') {
  const q = sort ? `?sort=${encodeURIComponent(sort)}` : '';
  return apiRequest(`/api/leads${q}`);
}

export async function getLead(id) {
  return apiRequest(`/api/leads/${id}`);
}

export async function createLead(data) {
  return apiRequest('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLead(id, data) {
  return apiRequest(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id) {
  return apiRequest(`/api/leads/${id}`, { method: 'DELETE' });
}

/**
 * @param {string[]} ids
 * @param {Record<string, unknown>} updates
 */
export async function bulkUpdateLeads(ids, updates) {
  return apiRequest('/api/leads/bulk-update', {
    method: 'POST',
    body: JSON.stringify({ ids, updates }),
  });
}

/**
 * @param {string[]} ids
 */
export async function bulkDeleteLeads(ids) {
  return apiRequest('/api/leads/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * @param {Record<string, unknown>[]} leads
 */
export async function createLeadsBulk(leads) {
  const results = [];
  const errors = [];
  for (const lead of leads) {
    try {
      results.push(await createLead(lead));
    } catch (err) {
      errors.push({ lead, message: err.message });
    }
  }
  if (errors.length && results.length === 0) {
    throw new Error(errors[0].message);
  }
  return { created: results, errors };
}
