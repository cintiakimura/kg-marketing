import { Lead, Campaign, EmailMessage, Webinar } from '@/api/entities';
import { invokeLLM, sendEmail } from '@/api/integrations';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Search, Mail, Calendar as CalendarIcon, Edit, Send, Bell } from 'lucide-react';
import ImportLeadsModal from '../components/leads/ImportLeadsModal';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import EditLeadModal from '../components/leads/EditLeadModal';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Leads() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list('-created_date')
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list()
  });

  const sendFollowupsMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      let sentCount = 0;
      const errors = [];

      for (const lead of leads) {
        if (!lead.last_status_change || !lead.campaign_id) continue;

        const campaign = campaigns.find(c => c.id === lead.campaign_id);
        if (!campaign || !campaign.followup_sequences) continue;

        for (const sequence of campaign.followup_sequences) {
          if (sequence.trigger_status !== lead.status) continue;

          const statusChangeDate = new Date(lead.last_status_change);
          const daysSinceChange = Math.floor((now - statusChangeDate) / (1000 * 60 * 60 * 24));

          if (daysSinceChange >= sequence.delay_days) {
            const alreadySent = lead.followup_history?.some(
              h => h.status === lead.status && h.subject === sequence.email_subject
            );

            if (!alreadySent) {
              try {
                const personalizedBody = `Dear ${lead.full_name},\n\n${sequence.email_body}\n\nBest regards,\nCintia Kimura\nFounder and COO\ncintia@kgprotech.com\nTel: +33 07 68 62 07 04`;

                await sendEmail({
                  from_name: 'KG PROTECH',
                  to: lead.email,
                  subject: sequence.email_subject,
                  body: personalizedBody.replace(/\n/g, '<br>')
                });

                await EmailMessage.create({
                  subject: sequence.email_subject,
                  body: personalizedBody,
                  from_email: 'campaigns@kgprotech.com',
                  to_email: lead.email,
                  folder: 'sent',
                  is_read: true,
                  date: new Date().toISOString()
                });

                const updatedHistory = lead.followup_history || [];
                updatedHistory.push({
                  date: new Date().toISOString(),
                  subject: sequence.email_subject,
                  status: lead.status
                });

                await Lead.update(lead.id, {
                  followup_history: updatedHistory
                });

                // If auto-schedule meeting is enabled, trigger AI scheduler
                if (sequence.schedule_meeting) {
                  try {
                    const schedulingPrompt = `Find optimal meeting time for lead ${lead.full_name} (${lead.language_preference || 'English'}, ${lead.company || 'company'}) in next 7 days. Consider European business hours. Return ISO datetime, day name, and time display.`;
                    
                    const timeResult = await invokeLLM({
                      prompt: schedulingPrompt,
                      response_json_schema: {
                        type: "object",
                        properties: {
                          datetime: { type: "string" },
                          day_name: { type: "string" },
                          time_display: { type: "string" }
                        }
                      }
                    });

                    await Webinar.create({
                      title: `Follow-up Meeting with ${lead.full_name}`,
                      description: `Auto-scheduled follow-up meeting`,
                      start_time: timeResult.datetime,
                      end_time: new Date(new Date(timeResult.datetime).getTime() + 15 * 60000).toISOString(),
                      host_name: 'Cintia Kimura',
                      meeting_link: 'https://meet.google.com/xyz',
                      attendees: [{
                        name: lead.full_name,
                        email: lead.email,
                        registered_at: new Date().toISOString()
                      }]
                    });

                    await Lead.update(lead.id, {
                      status: 'scheduled',
                      next_followup_date: timeResult.datetime
                    });

                    console.log('Auto-scheduled meeting for', lead.email, 'at', timeResult.time_display);
                  } catch (scheduleError) {
                    console.warn('Auto-scheduling failed for', lead.email, scheduleError);
                  }
                }

                sentCount++;
              } catch (error) {
                errors.push({ lead: lead.full_name, error: error.message });
              }
            }
          }
        }
      }

      return { sentCount, errors };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['emails']);

      const successMessage = document.createElement('div');
      successMessage.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: #2a2a2a; border: 2px solid #00c600; border-radius: 12px; 
                    padding: 32px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    text-align: center; min-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h2 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 12px;">
            Follow-ups Sent Successfully!
          </h2>
          <p style="color: #00c600; font-size: 18px;">
            ${data.sentCount} follow-up emails sent
          </p>
        </div>
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9998;" onclick="this.parentElement.remove()"></div>
      `;
      document.body.appendChild(successMessage);

      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    }
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: ({ leadId, status }) => 
      Lead.update(leadId, { 
        status, 
        last_status_change: new Date().toISOString() 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
    }
  });

  const pendingFollowupsCount = leads.filter(lead => {
    if (!lead.last_status_change || !lead.campaign_id) return false;
    
    const campaign = campaigns.find(c => c.id === lead.campaign_id);
    if (!campaign?.followup_sequences) return false;

    const now = new Date();
    const statusChangeDate = new Date(lead.last_status_change);
    
    return campaign.followup_sequences.some(seq => {
      if (seq.trigger_status !== lead.status) return false;
      
      const daysSinceChange = Math.floor((now - statusChangeDate) / (1000 * 60 * 60 * 24));
      const alreadySent = lead.followup_history?.some(
        h => h.status === lead.status && h.subject === seq.email_subject
      );
      
      return daysSinceChange >= seq.delay_days && !alreadySent;
    });
  }).length;

  const filteredLeads = leads.filter(lead => 
    lead.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    new: 'bg-blue-500',
    contacted: 'bg-yellow-500',
    interested: 'bg-purple-500',
    scheduled: 'bg-orange-500',
    closed: 'bg-[#00c600]'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
          <p className="text-gray-400">Manage and track your leads</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => sendFollowupsMutation.mutate()}
            disabled={pendingFollowupsCount === 0 || sendFollowupsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white relative"
          >
            <Send className="w-5 h-5 mr-2" />
            Send Pending Follow-ups
            {pendingFollowupsCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white border-0 px-2">
                {pendingFollowupsCount}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Lead
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-[#333333] hover:bg-[#444444] text-white"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import Leads
          </Button>
        </div>
      </div>

      <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, or company..."
            className="pl-10 bg-[#333333] border-[#444444] text-white"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {searchQuery ? 'No leads found matching your search' : 'No leads yet. Import leads to get started!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#333333] hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Company</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Language</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map(lead => {
                  const hasPendingFollowup = (() => {
                    if (!lead.last_status_change || !lead.campaign_id) return false;
                    
                    const campaign = campaigns.find(c => c.id === lead.campaign_id);
                    if (!campaign?.followup_sequences) return false;

                    const now = new Date();
                    const statusChangeDate = new Date(lead.last_status_change);
                    
                    return campaign.followup_sequences.some(seq => {
                      if (seq.trigger_status !== lead.status) return false;
                      
                      const daysSinceChange = Math.floor((now - statusChangeDate) / (1000 * 60 * 60 * 24));
                      const alreadySent = lead.followup_history?.some(
                        h => h.status === lead.status && h.subject === seq.email_subject
                      );
                      
                      return daysSinceChange >= seq.delay_days && !alreadySent;
                    });
                  })();

                  return (
                    <TableRow key={lead.id} className={`border-[#333333] hover:bg-[#333333] ${hasPendingFollowup ? 'bg-blue-500/10' : ''}`}>
                      <TableCell className="text-white font-medium">
                        <div className="flex items-center gap-2">
                          {hasPendingFollowup && (
                            <Bell className="w-4 h-4 text-blue-500 animate-pulse" />
                          )}
                          {lead.full_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{lead.email}</TableCell>
                      <TableCell className="text-gray-300">{lead.company || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[lead.status]} text-white border-0`}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{lead.language_preference || 'English'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsEditModalOpen(true);
                          }}
                          className="text-[#00c600] hover:text-[#00dd00] hover:bg-[#00c600]/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#00c600] hover:text-[#00dd00] hover:bg-[#00c600]/10"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#00c600] hover:text-[#00dd00] hover:bg-[#00c600]/10"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries(['leads'])}
      />

      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries(['leads'])}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSuccess={() => queryClient.invalidateQueries(['leads'])}
      />
    </div>
  );
}