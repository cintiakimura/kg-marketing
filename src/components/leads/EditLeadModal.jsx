import { Lead } from '@/api/entities';
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AIScheduler from '../meetings/AIScheduler';

export default function EditLeadModal({ isOpen, onClose, lead, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    status: 'new',
    language_preference: 'English',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        full_name: lead.full_name || '',
        email: lead.email || '',
        company: lead.company || '',
        status: lead.status || 'new',
        language_preference: lead.language_preference || 'English',
        notes: lead.notes || ''
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      alert('Please fill in name and email');
      return;
    }

    setIsSaving(true);
    try {
      const updates = { ...formData };
      
      // Track status changes for follow-up automation
      if (formData.status !== lead.status) {
        updates.last_status_change = new Date().toISOString();
      }
      
      await Lead.update(lead.id, updates);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-kg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="sticky top-0 bg-kg-card border-b border-green-500/25 p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">Edit Lead</h2>
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
              className="bg-kg-input border-green-500/20 text-white"
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
              className="bg-kg-input border-green-500/20 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Company</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Company Name"
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                <SelectTrigger className="bg-kg-input border-green-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 mb-2">Language</Label>
              <Select value={formData.language_preference} onValueChange={(val) => setFormData(prev => ({ ...prev, language_preference: val }))}>
                <SelectTrigger className="bg-kg-input border-green-500/20 text-white">
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
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

          <div className="border-t border-green-500/25 pt-4">
            <AIScheduler 
              lead={formData}
              onScheduled={() => {
                onSuccess();
                onClose();
              }}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-green-500/25">
            <Button
              type="submit"
              disabled={isSaving}
              variant="kg" className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-green-500/20 text-gray-300 hover:bg-kg-input"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}