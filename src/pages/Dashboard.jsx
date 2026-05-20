import { Campaign, Lead, Client, EmailMessage, Webinar } from '@/api/entities';
import { isAuthenticated, redirectToLogin } from '@/api/auth';
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../components/dashboard/StatsCard';
import { Megaphone, Users, Building2, Mail, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
  useEffect(() => {
    // TODO: Check auth session and redirect unauthenticated users to login
    isAuthenticated().then(isAuth => {
      if (!isAuth) {
        redirectToLogin(window.location.pathname);
      }
    });
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    // TODO: Fetch campaigns from your backend API
    queryFn: () => Campaign.list()
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    // TODO: Fetch leads from your backend API
    queryFn: () => Lead.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    // TODO: Fetch clients from your backend API
    queryFn: () => Client.list()
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    // TODO: Fetch email messages from your backend API
    queryFn: () => EmailMessage.list()
  });

  const { data: webinars = [] } = useQuery({
    queryKey: ['webinars'],
    // TODO: Fetch webinars from your backend API
    queryFn: () => Webinar.list()
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const unreadEmails = emails.filter(e => !e.is_read && e.folder === 'inbox').length;
  const upcomingWebinars = webinars.filter(w => new Date(w.start_time) > new Date()).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Campaign-in-a-Box</h1>
        <p className="text-gray-400">Manage your IoT automotive training campaigns and leads</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Megaphone}
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          title="Total Leads"
          value={leads.length}
          icon={Users}
          trend="up"
          trendValue="+8%"
        />
        <StatsCard
          title="Clients"
          value={clients.length}
          icon={Building2}
          trend="up"
          trendValue="+5%"
        />
        <StatsCard
          title="Unread Messages"
          value={unreadEmails}
          icon={Mail}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#333333]">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00c600]" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#333333]">
              <span className="text-gray-300 text-sm">New leads imported</span>
              <span className="text-[#00c600] font-medium">{leads.filter(l => l.status === 'new').length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#333333]">
              <span className="text-gray-300 text-sm">Emails sent today</span>
              <span className="text-[#00c600] font-medium">{emails.filter(e => e.folder === 'sent').length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-300 text-sm">Campaign completion rate</span>
              <span className="text-[#00c600] font-medium">87%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#333333]">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00c600]" />
            Upcoming Webinars
          </h2>
          {upcomingWebinars === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming webinars scheduled</p>
          ) : (
            <div className="space-y-3">
              {webinars
                .filter(w => new Date(w.start_time) > new Date())
                .slice(0, 3)
                .map(webinar => (
                  <div key={webinar.id} className="flex items-center justify-between py-2 border-b border-[#333333]">
                    <div>
                      <p className="text-white text-sm font-medium">{webinar.title}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(webinar.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[#00c600] text-xs">
                      {webinar.attendees?.length || 0} registered
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}