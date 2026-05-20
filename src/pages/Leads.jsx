import { Lead, Campaign, EmailMessage, Webinar } from '@/api/entities';
import { bulkDeleteLeads, bulkUpdateLeads } from '@/api/leads';
import { invokeLLM, sendEmail } from '@/api/integrations';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Upload,
  Search,
  Send,
  Bell,
  Sparkles,
  Filter,
  LayoutGrid,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImportLeadsModal from '../components/leads/ImportLeadsModal';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import SmartLeadFinder from '../components/leads/SmartLeadFinder';
import LeadsPipeline from '../components/leads/LeadsPipeline';
import LeadsTable from '../components/leads/LeadsTable';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import LeadsBulkBar from '../components/leads/LeadsBulkBar';
import { PIPELINE_STATUSES, normalizeLeadStatus } from '@/lib/leadConstants';
import { useToast } from '@/components/ui/use-toast';

export default function Leads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSmartFinderOpen, setIsSmartFinderOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: leads = [], isLoading, isError, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list('-created_date'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leads'] });

  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, updates }) => Lead.update(leadId, updates),
    onSuccess: invalidate,
  });

  const handleStatusChange = (leadId, status) => {
    const updates = {
      status,
      last_status_change: new Date().toISOString(),
    };
    if (status === 'contacted') {
      updates.last_contact_at = new Date().toISOString();
    }
    updateLeadMutation.mutate({ leadId, updates });
  };

  const bulkMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === 'status') {
        return bulkUpdateLeads(payload.ids, {
          status: payload.status,
          last_status_change: new Date().toISOString(),
          ...(payload.status === 'contacted'
            ? { last_contact_at: new Date().toISOString() }
            : {}),
        });
      }
      if (type === 'followup') {
        return bulkUpdateLeads(payload.ids, {
          next_followup_date: payload.date,
        });
      }
      if (type === 'delete') {
        return bulkDeleteLeads(payload.ids);
      }
    },
    onSuccess: (_, vars) => {
      setSelectedIds(new Set());
      invalidate();
      if (vars.type === 'delete') {
        toast({ title: 'Leads deleted' });
      } else {
        toast({ title: 'Bulk update applied' });
      }
    },
    onError: (err) => {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    },
  });

  const sendFollowupsMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      let sentCount = 0;
      const errors = [];

      for (const lead of leads) {
        if (!lead.last_status_change || !lead.campaign_id) continue;

        const campaign = campaigns.find((c) => c.id === lead.campaign_id);
        if (!campaign || !campaign.followup_sequences) continue;

        for (const sequence of campaign.followup_sequences) {
          if (sequence.trigger_status !== lead.status) continue;

          const statusChangeDate = new Date(lead.last_status_change);
          const daysSinceChange = Math.floor(
            (now - statusChangeDate) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceChange >= sequence.delay_days) {
            const alreadySent = lead.followup_history?.some(
              (h) => h.status === lead.status && h.subject === sequence.email_subject
            );

            if (!alreadySent) {
              try {
                const personalizedBody = `Dear ${lead.full_name},\n\n${sequence.email_body}\n\nBest regards,\nCintia Kimura\nFounder and COO\ncintia@kgprotech.com\nTel: +33 07 68 62 07 04`;

                await sendEmail({
                  from_name: 'KG PROTECH',
                  to: lead.email,
                  subject: sequence.email_subject,
                  body: personalizedBody.replace(/\n/g, '<br>'),
                });

                await EmailMessage.create({
                  subject: sequence.email_subject,
                  body: personalizedBody,
                  from_email: 'campaigns@kgprotech.com',
                  to_email: lead.email,
                  folder: 'sent',
                  is_read: true,
                  date: new Date().toISOString(),
                });

                const updatedHistory = lead.followup_history || [];
                updatedHistory.push({
                  date: new Date().toISOString(),
                  subject: sequence.email_subject,
                  status: lead.status,
                });

                await Lead.update(lead.id, {
                  followup_history: updatedHistory,
                });

                if (sequence.schedule_meeting) {
                  try {
                    const schedulingPrompt = `Find optimal meeting time for lead ${lead.full_name} (${lead.language_preference || 'English'}, ${lead.company || 'company'}) in next 7 days.`;
                    const timeResult = await invokeLLM({
                      prompt: schedulingPrompt,
                      response_json_schema: {
                        type: 'object',
                        properties: {
                          datetime: { type: 'string' },
                          day_name: { type: 'string' },
                          time_display: { type: 'string' },
                        },
                      },
                    });

                    await Webinar.create({
                      title: `Follow-up Meeting with ${lead.full_name}`,
                      description: 'Auto-scheduled follow-up meeting',
                      start_time: timeResult.datetime,
                      end_time: new Date(
                        new Date(timeResult.datetime).getTime() + 15 * 60000
                      ).toISOString(),
                      host_name: 'Cintia Kimura',
                      meeting_link: 'https://meet.google.com/xyz',
                      attendees: [
                        {
                          name: lead.full_name,
                          email: lead.email,
                          registered_at: new Date().toISOString(),
                        },
                      ],
                    });

                    await Lead.update(lead.id, {
                      status: 'interested',
                      next_followup_date: timeResult.datetime?.slice(0, 10),
                    });
                  } catch (scheduleError) {
                    console.warn('Auto-scheduling failed', scheduleError);
                  }
                }

                sentCount++;
              } catch (err) {
                errors.push({ lead: lead.full_name, error: err.message });
              }
            }
          }
        }
      }

      return { sentCount, errors };
    },
    onSuccess: (data) => {
      invalidate();
      toast({
        title: 'Campaign follow-ups sent',
        description: `${data.sentCount} email(s) sent`,
      });
    },
  });

  const pendingFollowupsCount = leads.filter((lead) => {
    if (!lead.last_status_change || !lead.campaign_id) return false;
    const campaign = campaigns.find((c) => c.id === lead.campaign_id);
    if (!campaign?.followup_sequences) return false;
    const now = new Date();
    const statusChangeDate = new Date(lead.last_status_change);
    return campaign.followup_sequences.some((seq) => {
      if (seq.trigger_status !== lead.status) return false;
      const daysSinceChange = Math.floor(
        (now - statusChangeDate) / (1000 * 60 * 60 * 24)
      );
      const alreadySent = lead.followup_history?.some(
        (h) => h.status === lead.status && h.subject === seq.email_subject
      );
      return daysSinceChange >= seq.delay_days && !alreadySent;
    });
  }).length;

  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const today = new Date(new Date().toDateString());

    return leads.filter((lead) => {
      const status = normalizeLeadStatus(lead.status);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (followUpFilter === 'due' && lead.next_followup_date) {
        if (new Date(lead.next_followup_date) >= today) return false;
      } else if (followUpFilter === 'upcoming' && lead.next_followup_date) {
        if (new Date(lead.next_followup_date) < today) return false;
      } else if (followUpFilter === 'none' && lead.next_followup_date) {
        return false;
      }

      if (!q) return true;
      return (
        lead.full_name?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.title?.toLowerCase().includes(q) ||
        lead.notes?.toLowerCase().includes(q)
      );
    });
  }, [leads, searchQuery, statusFilter, followUpFilter]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((l) => selectedIds.has(l.id));

  const stats = useMemo(() => {
    const due = leads.filter(
      (l) =>
        l.next_followup_date &&
        new Date(l.next_followup_date) < new Date(new Date().toDateString())
    ).length;
    return { total: leads.length, due, smart: leads.filter((l) => l.source === 'smart_lead_finder').length };
  }, [leads]);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="kg-page-title mb-2 flex items-center gap-2">
            <LayoutGrid className="w-8 h-8 text-kg-green" />
            Leads Workspace
          </h1>
          <p className="text-base text-gray-400 leading-relaxed">
            Pipeline, follow-ups, and Smart Finder imports — {stats.total} leads
            {stats.due > 0 && (
              <span className="text-amber-400"> · {stats.due} follow-up overdue</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => sendFollowupsMutation.mutate()}
            disabled={pendingFollowupsCount === 0 || sendFollowupsMutation.isPending}
            variant="kgBlue"
          >
            <Send className="w-4 h-4 mr-2" />
            Campaign follow-ups
            {pendingFollowupsCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingFollowupsCount}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setIsSmartFinderOpen(true)}
            variant="kg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Smart Lead Finder
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="kg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="kgMuted"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          Could not load leads: {error?.message}. Set{' '}
          <code className="text-kg-green">VITE_KG_MARKETING_API_URL</code> in .env.local.
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">Loading leads…</div>
      ) : (
        <>
          <LeadsPipeline
            leads={leads}
            onStatusChange={handleStatusChange}
            onOpenLead={setDetailLead}
          />

          <div className="bg-kg-surface rounded-xl border border-kg-green/25 p-6 md:p-8 space-y-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, company, title, notes…"
                  className="pl-10 bg-kg-raised border-kg-green/20 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] bg-kg-raised border-kg-green/20 text-white">
                  <Filter className="w-4 h-4 mr-2 text-kg-green" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {PIPELINE_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
                <SelectTrigger className="w-full md:w-[200px] bg-kg-raised border-kg-green/20 text-white">
                  <Bell className="w-4 h-4 mr-2 text-amber-400" />
                  <SelectValue placeholder="Follow-up" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All follow-ups</SelectItem>
                  <SelectItem value="due">Overdue</SelectItem>
                  <SelectItem value="upcoming">Scheduled</SelectItem>
                  <SelectItem value="none">No date set</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery || statusFilter !== 'all' || followUpFilter !== 'all'
                  ? 'No leads match your filters.'
                  : 'No leads yet. Use Smart Lead Finder or Add Lead to get started.'}
              </div>
            ) : (
              <LeadsTable
                leads={filteredLeads}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={() => {
                  if (allVisibleSelected) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
                  }
                }}
                allSelected={allVisibleSelected}
                onOpenLead={setDetailLead}
              />
            )}
          </div>
        </>
      )}

      <LeadsBulkBar
        count={selectedIds.size}
        isBusy={bulkMutation.isPending}
        onApplyStatus={(status) =>
          bulkMutation.mutate({
            type: 'status',
            payload: { ids: [...selectedIds], status },
          })
        }
        onApplyFollowUpDate={(date) =>
          bulkMutation.mutate({
            type: 'followup',
            payload: { ids: [...selectedIds], date },
          })
        }
        onDelete={() => {
          if (
            window.confirm(
              `Delete ${selectedIds.size} lead(s)? This cannot be undone.`
            )
          ) {
            bulkMutation.mutate({
              type: 'delete',
              payload: { ids: [...selectedIds] },
            });
          }
        }}
      />

      <SmartLeadFinder
        isOpen={isSmartFinderOpen}
        onClose={() => setIsSmartFinderOpen(false)}
        onSuccess={invalidate}
      />
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={invalidate}
      />
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={invalidate}
      />
      <LeadDetailModal
        isOpen={Boolean(detailLead)}
        lead={detailLead}
        onClose={() => setDetailLead(null)}
        onSuccess={invalidate}
      />
    </div>
  );
}
