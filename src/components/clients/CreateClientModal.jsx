import { Client } from '@/api/entities';
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function CreateClientModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    industry: '',
    status: 'prospect',
    deal_value: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please fill in company name');
      return;
    }

    setIsSaving(true);
    try {
      await Client.create(formData);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        contact_name: '',
        industry: '',
        status: 'prospect',
        deal_value: '',
        notes: '',
      });
    } catch (error) {
      alert('Failed to create client');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="sticky top-0 bg-[#2a2a2a] border-b border-[#333333] p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">Create New Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Company Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Company Inc."
              className="bg-[#333333] border-[#444444] text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Contact Name</Label>
            <Input
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Jane Smith"
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Deal Value (USD)</Label>
            <Input
              type="number"
              min="0"
              value={formData.deal_value}
              onChange={(e) => setFormData(prev => ({ ...prev, deal_value: e.target.value }))}
              placeholder="50000"
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Industry</Label>
            <Input
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="Automotive, Technology, etc."
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
              <SelectTrigger className="bg-[#333333] border-[#444444] text-white">
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
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={4}
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#333333]">
            <Button
              type="submit"
              disabled={isSaving}
              variant="kg" className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Client'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-[#444444] text-gray-300 hover:bg-[#333333]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}