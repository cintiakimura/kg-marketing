import { Campaign, Lead, EmailMessage } from '@/api/entities';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Megaphone, Mail } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';

export default function Statistics() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list()
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list()
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    queryFn: () => EmailMessage.list()
  });

  // Lead status distribution
  const leadStatusData = [
    { name: 'New', value: leads.filter(l => l.status === 'new').length, color: '#3b82f6' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: '#eab308' },
    { name: 'Interested', value: leads.filter(l => l.status === 'interested').length, color: '#a855f7' },
    { name: 'Scheduled', value: leads.filter(l => l.status === 'scheduled').length, color: '#f97316' },
    { name: 'Closed', value: leads.filter(l => l.status === 'closed').length, color: '#14532d' }
  ];

  // Campaign performance
  const campaignData = campaigns.map(c => ({
    name: c.name,
    sent: c.sent_count || 0
  }));

  // Language distribution
  const languageData = [
    { name: 'English', value: leads.filter(l => !l.language_preference || l.language_preference === 'English').length },
    { name: 'Spanish', value: leads.filter(l => l.language_preference === 'Spanish').length },
    { name: 'French', value: leads.filter(l => l.language_preference === 'French').length },
    { name: 'German', value: leads.filter(l => l.language_preference === 'German').length },
    { name: 'Portuguese', value: leads.filter(l => l.language_preference === 'Portuguese').length }
  ].filter(item => item.value > 0);

  const emailsSent = emails.filter(e => e.folder === 'sent').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium text-white mb-2">Statistics</h1>
        <p className="text-gray-400">Analytics and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Campaigns"
          value={campaigns.length}
          icon={Megaphone}
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Leads"
          value={leads.length}
          icon={Users}
          trend="up"
          trendValue="+18%"
        />
        <StatsCard
          title="Emails Sent"
          value={emailsSent}
          icon={Mail}
          trend="up"
          trendValue="+25%"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <div className="bg-kg-card rounded-xl border border-green-500/25 p-6">
          <h2 className="text-lg font-medium text-white mb-6">Lead Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leadStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1f0a', 
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Performance */}
        <div className="bg-kg-card rounded-xl border border-green-500/25 p-6">
          <h2 className="text-lg font-medium text-white mb-6">Campaign Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1f0a', 
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="sent" fill="#14532d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Language Preferences */}
        <div className="bg-kg-card rounded-xl border border-green-500/25 p-6">
          <h2 className="text-lg font-medium text-white mb-6">Lead Language Preferences</h2>
          <div className="space-y-4">
            {languageData.map((item, index) => {
              const percentage = (item.value / leads.length) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">{item.name}</span>
                    <span className="text-green-400 text-sm font-medium">
                      {item.value} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-kg-input rounded-full h-2">
                    <div 
                      className="bg-green-500/40 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-kg-card rounded-xl border border-green-500/25 p-6">
          <h2 className="text-lg font-medium text-white mb-6">Lead Conversion Funnel</h2>
          <div className="space-y-3">
            {[
              { label: 'New Leads', value: leads.filter(l => l.status === 'new').length, color: '#3b82f6' },
              { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: '#eab308' },
              { label: 'Interested', value: leads.filter(l => l.status === 'interested').length, color: '#a855f7' },
              { label: 'Scheduled', value: leads.filter(l => l.status === 'scheduled').length, color: '#f97316' },
              { label: 'Closed', value: leads.filter(l => l.status === 'closed').length, color: '#14532d' }
            ].map((stage, index) => {
              const maxWidth = leads.length > 0 ? (stage.value / leads.length) * 100 : 0;
              return (
                <div key={index} className="relative">
                  <div 
                    className="rounded-lg p-4 transition-all"
                    style={{ 
                      backgroundColor: stage.color + '20',
                      width: `${Math.max(maxWidth, 20)}%`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">{stage.label}</span>
                      <span className="text-white font-bold">{stage.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}