import { apiRequest } from '@/lib/apiClient';

export async function listClients() {
  return apiRequest('/api/clients');
}

export async function getClient(id) {
  return apiRequest(`/api/clients/${id}`);
}

export async function createClient(data) {
  return apiRequest('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(id, data) {
  return apiRequest(`/api/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id) {
  return apiRequest(`/api/clients/${id}`, { method: 'DELETE' });
}
