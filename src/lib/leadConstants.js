/** Pipeline statuses for the Leads workspace */

export const PIPELINE_STATUSES = [
  {
    id: 'new',
    label: 'New',
    color: 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/40',
    border: 'border-sky-500/50',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-300/40',
    border: 'border-amber-500/50',
  },
  {
    id: 'interested',
    label: 'Interested',
    color: 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-400/40',
    border: 'border-violet-500/50',
  },
  {
    id: 'follow_up_later',
    label: 'Follow-up Later',
    color: 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-300/40',
    border: 'border-orange-500/50',
  },
  {
    id: 'no_budget',
    label: 'No Budget',
    color: 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/40',
    border: 'border-rose-500/50',
  },
  {
    id: 'client',
    label: 'Client',
    color: 'bg-kg-green text-white shadow-sm ring-1 ring-[kg-green-hover]/50',
    border: 'border-kg-green/60',
  },
  {
    id: 'archived',
    label: 'Archived',
    color: 'bg-slate-600 text-white shadow-sm ring-1 ring-slate-400/30',
    border: 'border-slate-500/40',
  },
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
