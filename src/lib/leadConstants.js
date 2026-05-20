/** Pipeline statuses for the Leads workspace */

export const PIPELINE_STATUSES = [
  { id: 'new', label: 'New', color: 'bg-sky-500/90', border: 'border-sky-500/40' },
  { id: 'contacted', label: 'Contacted', color: 'bg-amber-500/90', border: 'border-amber-500/40' },
  { id: 'interested', label: 'Interested', color: 'bg-violet-500/90', border: 'border-violet-500/40' },
  {
    id: 'follow_up_later',
    label: 'Follow-up Later',
    color: 'bg-orange-500/90',
    border: 'border-orange-500/40',
  },
  { id: 'no_budget', label: 'No Budget', color: 'bg-rose-500/80', border: 'border-rose-500/40' },
  { id: 'client', label: 'Client', color: 'bg-[#00c600]', border: 'border-[#00c600]/50' },
  { id: 'archived', label: 'Archived', color: 'bg-gray-500/80', border: 'border-gray-500/40' },
];

const LEGACY_STATUS_MAP = {
  'follow-up': 'follow_up_later',
  follow_up: 'follow_up_later',
  closed: 'client',
  lost: 'archived',
  scheduled: 'interested',
  meeting: 'interested',
};

export function normalizeLeadStatus(status) {
  if (!status) return 'new';
  return LEGACY_STATUS_MAP[status] || status;
}

export function getStatusMeta(status) {
  const id = normalizeLeadStatus(status);
  return PIPELINE_STATUSES.find((s) => s.id === id) || PIPELINE_STATUSES[0];
}

export const SMART_FINDER_SOURCE = 'smart_lead_finder';

export function isSmartFinderLead(lead) {
  return lead?.source === SMART_FINDER_SOURCE;
}
