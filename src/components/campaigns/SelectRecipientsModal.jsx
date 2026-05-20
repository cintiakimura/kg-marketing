import React, { useState } from 'react';
import { X, Send, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function SelectRecipientsModal({ isOpen, onClose, leads, onConfirm, isLaunching, campaign }) {
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [manualEmails, setManualEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [useAIPersonalization, setUseAIPersonalization] = useState(true);

  if (!isOpen) return null;

  const toggleLead = (leadId) => {
    setSelectedLeads((prev) =>
    prev.includes(leadId) ?
    prev.filter((id) => id !== leadId) :
    [...prev, leadId]
    );
  };

  const toggleAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  const addManualEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (manualEmails.includes(email)) {
      alert('This email is already added');
      return;
    }
    
    setManualEmails([...manualEmails, email]);
    setEmailInput('');
  };

  const removeManualEmail = (email) => {
    setManualEmails(manualEmails.filter(e => e !== email));
  };

  const handleConfirm = () => {
    const selected = leads.filter((l) => selectedLeads.includes(l.id));
    const manualRecipients = manualEmails.map(email => ({ email, full_name: email }));
    onConfirm([...selected, ...manualRecipients], useAIPersonalization);
  };

  // Group leads by company
  const leadsByCompany = leads.reduce((acc, lead) => {
    const company = lead.company || 'No Company';
    if (!acc[company]) acc[company] = [];
    acc[company].push(lead);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[#333333] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Select Recipients</h2>
            <p className="text-gray-400 text-sm mt-1">
              {selectedLeads.length} leads + {manualEmails.length} manual recipients
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom p-6">
          <div className="mb-6 p-4 bg-[#333333] rounded-lg">
            <h3 className="text-white font-semibold mb-3">Add Recipients Manually</h3>
            <div className="flex gap-2 mb-3">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addManualEmail()}
                placeholder="Enter email address..."
                className="bg-[#2a2a2a] border-[#444444] text-white"
              />
              <Button
                onClick={addManualEmail}
                className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            {manualEmails.length > 0 && (
              <div className="space-y-2">
                {manualEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded">
                    <span className="text-white text-sm">{email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeManualEmail(email)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Button
              onClick={toggleAll}
              variant="outline"
              className="border-[#444444] text-gray-300 hover:bg-[#333333]"
            >
              {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(leadsByCompany).map(([company, companyLeads]) =>
            <div key={company} className="bg-[#333333] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  {company}
                  <Badge className="bg-[#444444] text-gray-300 border-0">
                    {companyLeads.length} leads
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {companyLeads.map((lead) =>
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-3 rounded hover:bg-[#444444] transition-colors cursor-pointer"
                  onClick={() => toggleLead(lead.id)}>

                      <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                    className="border-[#555555] data-[state=checked]:bg-[#00c600] data-[state=checked]:border-[#00c600]" />

                      <div className="flex-1">
                        <p className="text-white font-medium">{lead.full_name}</p>
                        <p className="text-gray-400 text-sm">{lead.email}</p>
                      </div>
                      <Badge className={`${
                  lead.status === 'new' ? 'bg-blue-500' :
                  lead.status === 'contacted' ? 'bg-yellow-500' :
                  lead.status === 'interested' ? 'bg-purple-500' :
                  lead.status === 'scheduled' ? 'bg-orange-500' :
                  'bg-[#00c600]'} text-white border-0`
                  }>
                        {lead.status}
                      </Badge>
                    </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#333333] p-6">
          <div className="flex items-center gap-3 mb-4 p-3 bg-[#333333] rounded-lg">
            <Checkbox
              checked={useAIPersonalization}
              onCheckedChange={setUseAIPersonalization}
              className="border-[#555555] data-[state=checked]:bg-[#00c600] data-[state=checked]:border-[#00c600]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00c600]" />
                <Label className="text-white font-medium cursor-pointer" onClick={() => setUseAIPersonalization(!useAIPersonalization)}>
                  AI-Powered Email Personalization
                </Label>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Automatically customize subject lines and email bodies based on each lead's company, industry, and interactions
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={(selectedLeads.length === 0 && manualEmails.length === 0) || isLaunching}
              className="flex-1 bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium"
            >
              {useAIPersonalization ? <Sparkles className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isLaunching ? 'Launching...' : `Launch to ${selectedLeads.length + manualEmails.length} Recipients`}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#444444] text-gray-300 hover:bg-[#333333]"
              disabled={isLaunching}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}