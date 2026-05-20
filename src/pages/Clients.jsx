import { Client } from '@/api/entities';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, Edit, Loader2, AlertCircle } from 'lucide-react';
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

function formatCurrency(value) {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function Clients() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => Client.list(),
  });

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(query) ||
      client.contact_name?.toLowerCase().includes(query) ||
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
          <p className="text-gray-400">Manage client companies and deals</p>
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
          placeholder="Search by name, contact, industry, or status..."
          className="pl-10 bg-[#2a2a2a] border-[#333333] text-white"
        />
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error?.message || 'Failed to load clients'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 flex justify-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin text-[#00c600]" />
          Loading clients…
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-[#2a2a2a] rounded-xl border border-[#333333]">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchQuery
              ? 'No clients found matching your search'
              : 'No clients yet. Add your first client to get started!'}
          </p>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#333333] hover:bg-transparent">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Company</TableHead>
                <TableHead className="text-gray-400">Industry</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Last Contact</TableHead>
                <TableHead className="text-gray-400">Value</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-[#333333] hover:bg-[#333333]">
                  <TableCell className="text-white font-medium">
                    {client.contact_name || client.name}
                  </TableCell>
                  <TableCell className="text-gray-300">{client.company || client.name}</TableCell>
                  <TableCell className="text-gray-300">{client.industry || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        client.status === 'active'
                          ? 'bg-[#00c600]'
                          : client.status === 'inactive'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                      } text-white border-0`}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {client.last_contact_at
                      ? new Date(client.last_contact_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-[#00c600] font-medium">
                    {formatCurrency(client.deal_value)}
                  </TableCell>
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
              ))}
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
