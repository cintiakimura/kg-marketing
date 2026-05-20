import { Client } from '@/api/entities';
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditClientModal({ isOpen, onClose, client, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    industry: '',
    status: 'prospect',
    deal_value: '',
    last_contact_at: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        contact_name: client.contact_name || '',
        industry: client.industry || '',
        status: client.status || 'prospect',
        deal_value: client.deal_value ?? '',
        last_contact_at: client.last_contact_at
          ? new Date(client.last_contact_at).toISOString().slice(0, 10)
          : '',
        notes: client.notes || '',
      });
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Client name is required');
      return;
    }

    setIsSaving(true);
    try {
      await Client.update(client.id, {
        ...formData,
        deal_value: formData.deal_value === '' ? null : formData.deal_value,
        last_contact_at: formData.last_contact_at
          ? new Date(formData.last_contact_at).toISOString()
          : null,
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-kg-card rounded-xl max-w-md w-full">
        <div className="border-b border-green-500/25 p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">Edit Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Client Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Company name"
              className="bg-kg-raised border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Contact Name</Label>
            <Input
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="bg-kg-raised border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Industry</Label>
            <Input
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Automotive, Technology"
              className="bg-kg-raised border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Deal Value (USD)</Label>
            <Input
              type="number"
              min="0"
              value={formData.deal_value}
              onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
              className="bg-kg-raised border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Last Contact</Label>
            <Input
              type="date"
              value={formData.last_contact_at}
              onChange={(e) => setFormData({ ...formData, last_contact_at: e.target.value })}
              className="bg-kg-raised border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
              <SelectTrigger className="bg-kg-raised border-green-500/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={4}
              className="bg-kg-raised border-green-500/20 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.name.trim()}
              variant="kg" className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-green-500/20 text-gray-300 hover:bg-kg-raised"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}