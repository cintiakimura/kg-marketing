import { apiRequest } from '@/lib/apiClient';

export async function listCampaigns() {
  return apiRequest('/api/campaigns');
}

export async function getCampaign(id) {
  return apiRequest(`/api/campaigns/${id}`);
}

export async function createCampaign(data) {
  return apiRequest('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id, data) {
  return apiRequest(`/api/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id) {
  return apiRequest(`/api/campaigns/${id}`, { method: 'DELETE' });
}

export async function duplicateCampaign(id) {
  return apiRequest(`/api/campaigns/${id}/duplicate`, { method: 'POST' });
}
