import { Campaign, Lead, EmailMessage } from '@/api/entities';
import { invokeLLM, sendEmail } from '@/api/integrations';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Rocket,
  Image as ImageIcon,
  Search,
  Copy,
  Archive,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal';
import EditCampaignModal from '../components/campaigns/EditCampaignModal';
import SelectRecipientsModal from '../components/campaigns/SelectRecipientsModal';
import { Badge } from '@/components/ui/badge';

export default function Campaigns() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSelectRecipientsOpen, setIsSelectRecipientsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns = [], isLoading, isError, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list()
  });

  const launchCampaignMutation = useMutation({
    mutationFn: async ({ campaign, selectedLeads, useAIPersonalization }) => {
      console.log('Starting campaign launch:', { campaign, recipientCount: selectedLeads.length, useAIPersonalization });

      if (!campaign.email_subject || !campaign.email_body) {
        throw new Error('Campaign must have both subject and body content');
      }

      const scheduleLink = `${window.location.origin}/ScheduleWebinar`;
      let successCount = 0;
      const errors = [];

      // Send emails sequentially to avoid rate limiting and ensure delivery
      for (const recipient of selectedLeads) {
        try {
          console.log('Sending email to:', recipient.email);

          let emailSubject = campaign.email_subject;
          let emailBody = campaign.email_body;

          // AI Personalization
          if (useAIPersonalization && recipient.full_name) {
            try {
              const personalizationPrompt = `You are personalizing a cold email for KG PROTECH's IoT automotive training product.

Original Subject: ${emailSubject}
Original Body: ${emailBody}

Lead Information:
- Name: ${recipient.full_name}
- Company: ${recipient.company || 'Not specified'}
- Email: ${recipient.email}
- Status: ${recipient.status || 'new'}
- Language: ${recipient.language_preference || 'English'}

TASK: Personalize ONLY the subject line and opening paragraph based on this lead's data. Keep the product benefits, CTA, and signature exactly the same.

Rules:
1. Address them by name: "Dear ${recipient.full_name},"
2. Reference their company if available
3. Keep it concise (same length as original)
4. Write in ${recipient.language_preference || 'English'}
5. Maintain professional tone
6. Keep the rest of the email identical

Return JSON with:
{
  "subject": "personalized subject here",
  "body": "full personalized email body with signature"
}`;

              const personalizedContent = await invokeLLM({
                prompt: personalizationPrompt,
                response_json_schema: {
                  type: "object",
                  properties: {
                    subject: { type: "string" },
                    body: { type: "string" }
                  }
                }
              });

              emailSubject = personalizedContent.subject;
              emailBody = personalizedContent.body;
            } catch (aiError) {
              console.warn('AI personalization failed, using original content:', aiError);
            }
          } else {
            // Non-AI personalization: just add name
            emailBody = `Dear ${recipient.full_name},\n\n${emailBody}`;
          }
          
          // Convert body to HTML
          const htmlBody = emailBody.replace(/\n/g, '<br>');
          
          console.log('Attempting to send email:', { to: recipient.email, subject: emailSubject, bodyLength: htmlBody.length });
          
          const emailResult = await sendEmail({
            to: recipient.email,
            subject: emailSubject,
            body: htmlBody
          });

          console.log('Email sent successfully to:', recipient.email, emailResult);

          // Create email record in database after successful send
          await EmailMessage.create({
            subject: emailSubject,
            body: htmlBody,
            from_email: 'campaigns@kgprotech.com',
            to_email: recipient.email,
            folder: 'sent',
            is_read: true,
            date: new Date().toISOString()
          });

          // Update lead with campaign reference
          if (recipient.id) {
            await Lead.update(recipient.id, {
              campaign_id: campaign.id
            });
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          errors.push({ email: recipient.email, error: error.message || String(error) });
        }
      }
      
      console.log('Campaign launch complete:', { successCount, totalCount: selectedLeads.length, errors });
      
      // Update campaign with successful sends
      await Campaign.update(campaign.id, {
        status: 'active',
        sent_count: (campaign.sent_count || 0) + successCount
      });

      if (successCount === 0 && errors.length > 0) {
        throw new Error(`All emails failed: ${errors[0].error}`);
      }

      return { successCount, totalCount: selectedLeads.length, errors };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['campaigns']);
      queryClient.invalidateQueries(['emails']);
      setIsSelectRecipientsOpen(false);
      
      // Show success popup with details
      const successMessage = document.createElement('div');
      const hasErrors = data.errors && data.errors.length > 0;
      successMessage.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: #0a1f0a; border: 2px solid ${hasErrors ? '#ff9900' : '#22A855'}; border-radius: 12px; 
                    padding: 32px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    text-align: center; min-width: 400px; max-width: 500px;">
          <div style="font-size: 48px; margin-bottom: 16px;">${hasErrors ? '⚠️' : '✅'}</div>
          <h2 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 12px;">
            ${hasErrors ? 'Campaign Partially Sent' : 'Campaign Sent Successfully!'}
          </h2>
          <p style="color: ${hasErrors ? '#ff9900' : '#22A855'}; font-size: 18px; margin-bottom: 8px;">
            ${data.successCount} of ${data.totalCount} emails sent
          </p>
          ${hasErrors ? `<p style="color: #ff4444; font-size: 14px; margin-bottom: 8px;">${data.errors.length} failed</p>` : ''}
          <p style="color: #888; font-size: 14px;">
            Campaign "${variables.campaign.name}" has been launched
          </p>
        </div>
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9998;" onclick="this.parentElement.remove()"></div>
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
        setSelectedCampaign(null);
      }, 4000);
    },
    onError: (error) => {
      console.error('Campaign launch failed:', error);
      
      // Show error popup
      const errorMessage = document.createElement('div');
      errorMessage.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: #0a1f0a; border: 2px solid #ff4444; border-radius: 12px; 
                    padding: 32px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    text-align: center; min-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <h2 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 12px;">
            Campaign Failed to Send
          </h2>
          <p style="color: #ff4444; font-size: 16px;">
            Please try again or contact support
          </p>
        </div>
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9998;" 
             onclick="this.parentElement.remove()"></div>
      `;
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage);
        }
      }, 4000);
    }
  });

  const handleLaunchClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsSelectRecipientsOpen(true);
  };

  const handleConfirmLaunch = (selectedLeads, useAIPersonalization) => {
    launchCampaignMutation.mutate({ campaign: selectedCampaign, selectedLeads, useAIPersonalization });
  };

  const handleEditClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const handleLaunchFromEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setIsEditModalOpen(false);
    setIsSelectRecipientsOpen(true);
  };

  const duplicateMutation = useMutation({
    mutationFn: (id) => Campaign.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast({ title: 'Campaign duplicated' });
    },
    onError: (err) => toast({ title: 'Duplicate failed', description: err.message, variant: 'destructive' }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => Campaign.update(id, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast({ title: 'Campaign archived' });
    },
    onError: (err) => toast({ title: 'Archive failed', description: err.message, variant: 'destructive' }),
  });

  const statusColors = {
    draft: 'bg-gray-500',
    active: 'bg-kg-btn',
    completed: 'bg-blue-500',
    paused: 'bg-yellow-500',
    archived: 'bg-gray-600',
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const query = searchQuery.toLowerCase();
    return (
      campaign.name?.toLowerCase().includes(query) ||
      campaign.target_audience?.toLowerCase().includes(query) ||
      campaign.language?.toLowerCase().includes(query) ||
      campaign.status?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="kg-page-title mb-2">Campaigns</h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-2xl">
            Create and launch B2B campaigns — use{' '}
            <span className="text-green-400">✨ Generate Campaign with Grok</span> in the
            create modal for full drafts (name, audience, email, video ideas).
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="kg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-10 bg-kg-input border-green-500/25 text-white"
          />
        </div>
        <div className="flex gap-1 border border-green-500/25 rounded-lg p-1 bg-kg-card">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-kg-btn text-white shadow-sm' : 'text-gray-400'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            onClick={() => setViewMode('cards')}
            className={viewMode === 'cards' ? 'bg-kg-btn text-white shadow-sm' : 'text-gray-400'}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-[18px]">{error?.message || 'Failed to load campaigns'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 flex justify-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin text-green-400" />
          Loading campaigns…
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-kg-card rounded-xl border border-green-500/25">
          <Rocket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{searchQuery ? 'No campaigns found matching your search' : 'No campaigns yet. Create your first campaign to get started!'}</p>
          {!searchQuery && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="kg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Campaign
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-kg-card rounded-xl border border-green-500/25 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-green-500/25 hover:bg-transparent">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Leads</TableHead>
                <TableHead className="text-gray-400">Start Date</TableHead>
                <TableHead className="text-gray-400">Performance</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="border-green-500/25 hover:bg-kg-input">
                  <TableCell className="text-white font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[campaign.status] || 'bg-gray-500'} text-white border-0`}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{campaign.leads_count ?? 0}</TableCell>
                  <TableCell className="text-gray-400 text-[18px]">
                    {campaign.start_date || campaign.created_date
                      ? new Date(campaign.start_date || campaign.created_date).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-green-400">{campaign.performance ?? 0}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(campaign)}
                        className="kg-link text-green-400 hover:text-kg-btn-hover"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => duplicateMutation.mutate(campaign.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {campaign.status !== 'archived' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => archiveMutation.mutate(campaign.id)}
                          className="text-gray-400 hover:text-amber-400"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="bg-kg-card rounded-xl border border-green-500/25 overflow-hidden hover:border-green-500/40 transition-all">
              {campaign.media_url || campaign.generated_image_url ? (
                <>
                  {(campaign.media_type === 'image' || campaign.generated_image_url) && (
                    <img 
                      src={campaign.media_url || campaign.generated_image_url} 
                      alt={campaign.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {campaign.media_type === 'presentation' && (
                    <div className="w-full h-48 bg-kg-input flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">📄</div>
                        <p className="text-gray-400 text-[18px]">Presentation attached</p>
                      </div>
                    </div>
                  )}
                  {campaign.media_type === 'video_url' && (
                    <div className="w-full h-48 bg-kg-input flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🎥</div>
                        <p className="text-gray-400 text-[18px]">Video URL attached</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-48 bg-kg-input flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">{campaign.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(campaign)}
                      className="kg-link text-green-400 hover:text-kg-btn-hover hover:bg-kg-btn/10 h-8 px-2"
                    >
                      Edit
                    </Button>
                    <Badge className={`${statusColors[campaign.status]} text-white border-0`}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-gray-400 text-[18px]">
                    <span className="text-gray-500">Language:</span> {campaign.language}
                  </p>
                  <p className="text-gray-400 text-[18px]">
                    <span className="text-gray-500">Target:</span> {campaign.target_audience || 'Not specified'}
                  </p>
                  <p className="text-gray-400 text-[18px]">
                    <span className="text-gray-500">Sent:</span> {campaign.sent_count || 0} emails
                  </p>
                </div>

                {campaign.email_subject && (
                  <div className="mb-4 p-3 bg-kg-input rounded-lg">
                    <p className="text-gray-400 text-[18px] mb-1">Subject:</p>
                    <p className="text-white text-[18px]">{campaign.email_subject}</p>
                  </div>
                )}

                {(campaign.status === 'draft' || campaign.status === 'active') && (
                  <Button
                    onClick={() => handleLaunchClick(campaign)}
                    disabled={leads.length === 0}
                    variant="kg" className="w-full"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    {leads.length === 0 ? 'No Leads Available' : campaign.status === 'draft' ? 'Select Recipients & Launch' : 'Send to More Recipients'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries(['campaigns'])}
      />

      <EditCampaignModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onSuccess={() => queryClient.invalidateQueries(['campaigns'])}
        onLaunchClick={handleLaunchFromEdit}
      />

      <SelectRecipientsModal
        isOpen={isSelectRecipientsOpen}
        onClose={() => {
          setIsSelectRecipientsOpen(false);
          setSelectedCampaign(null);
        }}
        leads={leads}
        campaign={selectedCampaign}
        onConfirm={handleConfirmLaunch}
        isLaunching={launchCampaignMutation.isPending}
        onLeadCreated={() => queryClient.invalidateQueries(['leads'])}
      />
    </div>
  );
}