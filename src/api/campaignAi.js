import { apiRequest } from '@/lib/apiClient';

/**
 * Full campaign draft from a short brief (Grok via backend).
 * @param {{ brief_description: string, language?: string }} params
 */
export async function generateCampaignWithGrok({ brief_description, language = 'English' }) {
  const data = await apiRequest('/api/ai/generate-campaign', {
    method: 'POST',
    body: JSON.stringify({ brief_description, language, mode: 'full' }),
  });
  return data;
}

/**
 * Regenerate email subject variants + body for an existing draft.
 */
export async function generateCampaignEmailCopy({
  name,
  target_audience,
  language = 'English',
}) {
  const data = await apiRequest('/api/ai/generate-campaign', {
    method: 'POST',
    body: JSON.stringify({
      mode: 'email_only',
      name,
      target_audience,
      language,
    }),
  });
  return data;
}
