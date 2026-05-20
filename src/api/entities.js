/**
 * KG Marketing — data entities (replace with your REST/GraphQL backend).
 */

const entity = (name) => ({
  list: async (_sort) => {
    // TODO: Implement API call — list ${name} (e.g. GET /api/${name.toLowerCase()}s)
    return [];
  },
  filter: async (_criteria) => {
    // TODO: Implement API call — filter ${name} records
    return [];
  },
  create: async (_data) => {
    // TODO: Implement API call — create ${name} (e.g. POST /api/${name.toLowerCase()}s)
    return { id: `placeholder-${name}-${Date.now()}` };
  },
  update: async (id, _data) => {
    // TODO: Implement API call — update ${name} by id (e.g. PATCH /api/...)
    return { id };
  },
});

export const Lead = entity('Lead');
export const Campaign = entity('Campaign');
export const Client = entity('Client');
export const EmailMessage = entity('EmailMessage');
export const Webinar = entity('Webinar');
export const User = entity('User');
export const Query = entity('Query');
