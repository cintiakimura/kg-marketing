import { Lead } from '@/api/entities';
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function CreateLeadModal({ isOpen, onClose, onSuccess, prefilledClientId = null }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    client_id: prefilledClientId || '',
    status: 'new',
    language_preference: 'English',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (prefilledClientId) {
      setFormData(prev => ({ ...prev, client_id: prefilledClientId }));
    }
  }, [prefilledClientId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      alert('Please fill in name and email');
      return;
    }

    setIsSaving(true);
    try {
      await Lead.create(formData);
      onSuccess();
      onClose();
      setFormData({
        full_name: '',
        email: '',
        company: '',
        client_id: prefilledClientId || '',
        status: 'new',
        language_preference: 'English',
        notes: ''
      });
    } catch (error) {
      console.error('Lead creation error:', error);
      alert(`Failed to create lead: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="sticky top-0 bg-[#2a2a2a] border-b border-[#333333] p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">Create New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Full Name *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
              className="bg-[#333333] border-[#444444] text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@company.com"
              className="bg-[#333333] border-[#444444] text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Company</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Company Name"
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                <SelectTrigger className="bg-[#333333] border-[#444444] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="follow_up_later">Follow-up Later</SelectItem>
                  <SelectItem value="no_budget">No Budget</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 mb-2">Language</Label>
              <Select value={formData.language_preference} onValueChange={(val) => setFormData(prev => ({ ...prev, language_preference: val }))}>
                <SelectTrigger className="bg-[#333333] border-[#444444] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
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
              {isSaving ? 'Creating...' : 'Create Lead'}
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