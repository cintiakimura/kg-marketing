/**
 * KG Marketing — data entities.
 */
import {
  listLeads,
  createLead,
  updateLead,
  deleteLead,
} from './leads.js';

const entity = (name) => ({
  list: async () => [],
  filter: async () => [],
  create: async () => ({ id: `placeholder-${name}-${Date.now()}` }),
  update: async (id) => ({ id }),
});

export const Lead = {
  list: (sort) => listLeads(sort),
  filter: async () => [],
  create: (data) => createLead(data),
  update: (id, data) => updateLead(id, data),
  delete: (id) => deleteLead(id),
};
export const Campaign = entity('Campaign');
export const Client = entity('Client');
export const EmailMessage = entity('EmailMessage');
export const Webinar = entity('Webinar');
export const User = entity('User');
export const Query = entity('Query');
