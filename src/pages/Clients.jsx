import { Client, Lead } from '@/api/entities';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CreateClientModal from '../components/clients/CreateClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Clients() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => Client.list('-created_date')
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => Lead.list()
  });

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(query) ||
      client.industry?.toLowerCase().includes(query) ||
      client.status?.toLowerCase().includes(query)
    );
  });

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
          <p className="text-gray-400">Manage client companies</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients by name, industry, or status..."
          className="pl-10 bg-[#2a2a2a] border-[#333333] text-white"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-[#2a2a2a] rounded-xl border border-[#333333]">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{searchQuery ? 'No clients found matching your search' : 'No clients yet. Add your first client to get started!'}</p>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] rounded-xl border border-[#333333]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#333333] hover:bg-transparent">
                <TableHead className="text-gray-400">Company</TableHead>
                <TableHead className="text-gray-400">Industry</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Leads</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => {
                const clientLeads = leads.filter(l => l.client_id === client.id);
                
                return (
                  <TableRow key={client.id} className="border-[#333333] hover:bg-[#333333]">
                    <TableCell className="font-medium text-white">{client.name}</TableCell>
                    <TableCell className="text-gray-300">{client.industry || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${client.status === 'active' ? 'bg-[#00c600]' : client.status === 'inactive' ? 'bg-red-500' : 'bg-gray-500'} text-white border-0`}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{clientLeads.length}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClient(client)}
                        className="text-[#00c600] hover:text-[#00dd00] hover:bg-[#00c600]/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries(['clients'])}
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onSuccess={() => queryClient.invalidateQueries(['clients'])}
      />
    </div>
  );
}