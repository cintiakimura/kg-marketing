/**
 * KG Marketing — data entities (backend-backed).
 */
import {
  listLeads,
  createLead,
  updateLead,
  deleteLead,
} from './leads.js';
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
} from './campaigns.js';
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} from './clients.js';
const noopEntity = (name) => ({
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

export const Campaign = {
  list: () => listCampaigns(),
  filter: async () => [],
  create: (data) => createCampaign(data),
  update: (id, data) => updateCampaign(id, data),
  delete: (id) => deleteCampaign(id),
  duplicate: (id) => duplicateCampaign(id),
};

export const Client = {
  list: () => listClients(),
  filter: async () => [],
  create: (data) => createClient(data),
  update: (id, data) => updateClient(id, data),
  delete: (id) => deleteClient(id),
};

export const EmailMessage = noopEntity('EmailMessage');
export const Webinar = noopEntity('Webinar');
export const Query = noopEntity('Query');
