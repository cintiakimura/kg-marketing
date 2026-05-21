import { Campaign, Lead } from '@/api/entities';
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../components/dashboard/StatsCard';
import {
  Megaphone,
  Users,
  Bell,
  TrendingUp,
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { normalizeLeadStatus, getStatusMeta } from '@/lib/leadConstants';

function isFollowUpDue(lead) {
  if (!lead.next_followup_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(lead.next_followup_date);
  due.setHours(0, 0, 0, 0);
  return due <= today;
}

export default function Dashboard() {
  const {
    data: leads = [],
    isLoading: leadsLoading,
    isError: leadsError,
    error: leadsErr,
  } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list('-created_date'),
  });

  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    isError: campaignsError,
  } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list(),
  });

  const stats = useMemo(() => {
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const followUpDue = leads.filter(isFollowUpDue).length;
    const clients = leads.filter((l) => normalizeLeadStatus(l.status) === 'client').length;
    const conversion =
      leads.length > 0 ? Math.round((clients / leads.length) * 100) : 0;
    return { activeCampaigns, followUpDue, conversion };
  }, [leads, campaigns]);

  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort(
          (a, b) =>
            new Date(b.created_date || b.created_at) -
            new Date(a.created_date || a.created_at)
        )
        .slice(0, 8),
    [leads]
  );

  const loading = leadsLoading || campaignsLoading;
  const hasError = leadsError || campaignsError;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="kg-page-title mb-2">Dashboard</h1>
        <p className="text-base text-gray-400 leading-relaxed">
          Overview of leads, campaigns, and follow-ups
        </p>
      </div>

      {hasError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            {leadsErr?.message || 'Could not load dashboard data. Check API connection.'}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-400" />
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Total Leads" value={leads.length} icon={Users} />
            <StatsCard
              title="Active Campaigns"
              value={stats.activeCampaigns}
              icon={Megaphone}
            />
            <StatsCard
              title="Follow-up Due / Overdue"
              value={stats.followUpDue}
              icon={Bell}
            />
            <StatsCard
              title="Conversion Rate"
              value={`${stats.conversion}%`}
              icon={TrendingUp}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="kg"
            >
              <Link to="/leads">
                <Plus className="w-4 h-4 mr-2" />
                New Lead
              </Link>
            </Button>
            <Button
              asChild
              variant="kg"
            >
              <Link to="/leads">
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Lead Finder
              </Link>
            </Button>
            <Button
              asChild
              variant="kg"
            >
              <Link to="/campaigns">
                <Megaphone className="w-4 h-4 mr-2" />
                New Campaign
              </Link>
            </Button>
          </div>

          <div className="bg-kg-card rounded-xl border border-green-500/25 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-green-500/25">
              <h2 className="text-lg font-medium text-white">Recent Leads</h2>
              <Link
                to="/leads"
                className="kg-link text-green-400 hover:text-green-300"
              >
                View All
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <p className="p-8 text-gray-400 text-center text-sm">
                No leads yet. Add your first lead or run Smart Lead Finder.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-green-500/25 hover:bg-transparent">
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Company</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Follow-up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.map((lead) => {
                      const meta = getStatusMeta(lead.status);
                      return (
                        <TableRow
                          key={lead.id}
                          className="border-green-500/25 hover:bg-kg-input"
                        >
                          <TableCell className="text-white font-medium">
                            {lead.full_name}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {lead.company || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${meta.color} text-white border-0`}
                            >
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {lead.next_followup_date
                              ? new Date(lead.next_followup_date).toLocaleDateString()
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
