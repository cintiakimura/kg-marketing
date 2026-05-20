import { Campaign, Lead, User } from '@/api/entities';
import { getCurrentUser } from '@/api/auth';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Megaphone, TrendingUp, Target, Award } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ManagerDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list('-created_date')
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['teamUsers'],
    queryFn: () => User.list(),
    enabled: user?.role === 'admin' || user?.role === 'manager'
  });

  const teamMembers = users.filter(u => 
    u.manager_id === user?.id || u.id === user?.id
  );

  const teamCampaigns = campaigns.filter(c => 
    teamMembers.some(m => m.email === c.created_by)
  );

  const teamLeads = leads.filter(l => 
    teamMembers.some(m => m.email === l.created_by)
  );

  const activeCampaigns = teamCampaigns.filter(c => c.status === 'active').length;
  const totalEmailsSent = teamCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
  const newLeads = teamLeads.filter(l => l.status === 'new').length;
  const conversionRate = teamLeads.length > 0 
    ? ((teamLeads.filter(l => l.status === 'closed').length / teamLeads.length) * 100).toFixed(1)
    : 0;

  const performanceByMember = teamMembers.map(member => {
    const memberCampaigns = campaigns.filter(c => c.created_by === member.email);
    const memberLeads = leads.filter(l => l.created_by === member.email);
    return {
      name: member.full_name || member.email,
      campaigns: memberCampaigns.length,
      leads: memberLeads.length,
      emails: memberCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
    };
  });

  const leadStatusData = [
    { name: 'New', value: teamLeads.filter(l => l.status === 'new').length, color: '#3b82f6' },
    { name: 'Contacted', value: teamLeads.filter(l => l.status === 'contacted').length, color: '#f59e0b' },
    { name: 'Interested', value: teamLeads.filter(l => l.status === 'interested').length, color: '#a855f7' },
    { name: 'Scheduled', value: teamLeads.filter(l => l.status === 'scheduled').length, color: '#f97316' },
    { name: 'Closed', value: teamLeads.filter(l => l.status === 'closed').length, color: '#00c600' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manager Dashboard</h1>
        <p className="text-gray-400">Team performance overview and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Team Members"
          value={teamMembers.length}
          icon={Users}
        />
        <StatsCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Megaphone}
        />
        <StatsCard
          title="Total Leads"
          value={teamLeads.length}
          icon={Target}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6">
          <h3 className="text-lg font-bold text-white mb-4">Team Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceByMember}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
              <XAxis dataKey="name" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #333333' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="campaigns" fill="#00c600" name="Campaigns" />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6">
          <h3 className="text-lg font-bold text-white mb-4">Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leadStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #333333' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Team Members Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333333]">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Campaigns</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Leads</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Emails Sent</th>
              </tr>
            </thead>
            <tbody>
              {performanceByMember.map((member, idx) => (
                <tr key={idx} className="border-b border-[#333333] hover:bg-[#333333] transition-colors">
                  <td className="py-3 px-4 text-white">{member.name}</td>
                  <td className="py-3 px-4 text-gray-400">{users.find(u => u.full_name === member.name)?.email || '-'}</td>
                  <td className="py-3 px-4 text-center text-white">{member.campaigns}</td>
                  <td className="py-3 px-4 text-center text-white">{member.leads}</td>
                  <td className="py-3 px-4 text-center text-white">{member.emails}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Team Activity</h3>
        <div className="space-y-3">
          {teamCampaigns.slice(0, 5).map(campaign => (
            <div key={campaign.id} className="flex items-center justify-between p-3 bg-[#333333] rounded-lg">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-[#00c600]" />
                <div>
                  <p className="text-white font-medium">{campaign.name}</p>
                  <p className="text-gray-400 text-sm">by {users.find(u => u.email === campaign.created_by)?.full_name || campaign.created_by}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white">{campaign.sent_count || 0} emails sent</p>
                <p className="text-gray-400 text-sm">{campaign.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}