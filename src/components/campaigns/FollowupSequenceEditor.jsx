import { invokeLLM } from '@/api/integrations';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Clock, Mail, Calendar, Sparkles } from 'lucide-react';

export default function FollowupSequenceEditor({ sequences = [], onChange, targetAudience = '', language = 'English' }) {
  const [editingSequences, setEditingSequences] = useState(sequences);
  const [generatingIndex, setGeneratingIndex] = useState(null);

  const addSequence = () => {
    const newSequence = {
      trigger_status: 'contacted',
      delay_days: 2,
      email_subject: '',
      email_body: '',
      schedule_meeting: false
    };
    const updated = [...editingSequences, newSequence];
    setEditingSequences(updated);
    onChange(updated);
  };

  const updateSequence = (index, field, value) => {
    const updated = [...editingSequences];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSequences(updated);
    onChange(updated);
  };

  const removeSequence = (index) => {
    const updated = editingSequences.filter((_, i) => i !== index);
    setEditingSequences(updated);
    onChange(updated);
  };

  const generateFollowupContent = async (index, sequence) => {
    setGeneratingIndex(index);
    try {
      const statusContext = {
        new: 'lead just signed up',
        contacted: 'initial contact made',
        interested: 'lead showed interest',
        scheduled: 'meeting scheduled'
      }[sequence.trigger_status] || 'status changed';

      const prompt = `Generate follow-up email for KG PROTECH's IoT automotive training product.

Context: This email is sent ${sequence.delay_days} days after ${statusContext}.
Target Audience: ${targetAudience || 'automotive professionals'}
Language: ${language}
Product: Automatic Fault Simulator for vehicles via internet, enabling remote diagnostic training with 60% cost savings and reduced setup time.

Requirements:
1. Professional and concise (2-3 paragraphs)
2. Reference previous interaction contextually
3. Focus on next steps and value
4. Include webinar scheduling link
5. End with signature

Generate both subject and body.

Return JSON:
{
  "subject": "compelling subject line",
  "body": "email body with proper formatting"
}`;

      const result = await invokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      const updated = [...editingSequences];
      updated[index] = {
        ...updated[index],
        email_subject: result.subject,
        email_body: result.body
      };
      setEditingSequences(updated);
      onChange(updated);
    } catch (error) {
      alert('Failed to generate follow-up content. Please try again.');
    } finally {
      setGeneratingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-gray-300">Follow-up Sequences</Label>
        <Button
          type="button"
          onClick={addSequence}
          size="sm"
          className="bg-kg-input hover:bg-[#444444] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Sequence
        </Button>
      </div>

      {editingSequences.length === 0 ? (
        <div className="p-4 bg-kg-input rounded-lg border border-green-500/20 text-center">
          <Mail className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-[18px]">No follow-up sequences defined</p>
          <p className="text-gray-500 text-[18px] mt-1">Click "Add Sequence" to create automated follow-ups</p>
        </div>
      ) : (
        <div className="space-y-4">
          {editingSequences.map((sequence, index) => (
            <div key={index} className="p-4 bg-kg-input rounded-lg border border-green-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium text-[18px]">Sequence {index + 1}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => generateFollowupContent(index, sequence)}
                    disabled={generatingIndex === index}
                    size="sm"
                    variant="kgAi"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {generatingIndex === index ? 'Generating...' : 'AI Generate'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => removeSequence(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-[18px] mb-1">Trigger on Status</Label>
                  <Select 
                    value={sequence.trigger_status} 
                    onValueChange={(val) => updateSequence(index, 'trigger_status', val)}
                  >
                    <SelectTrigger className="bg-kg-card border-green-500/20 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-400 text-[18px] mb-1">Delay (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={sequence.delay_days}
                    onChange={(e) => updateSequence(index, 'delay_days', parseInt(e.target.value))}
                    className="bg-kg-card border-green-500/20 text-white h-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-400 text-[18px] mb-1">Email Subject</Label>
                <Input
                  value={sequence.email_subject}
                  onChange={(e) => updateSequence(index, 'email_subject', e.target.value)}
                  placeholder="Follow-up subject..."
                  className="bg-kg-card border-green-500/20 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-400 text-[18px] mb-1">Email Body</Label>
                <Textarea
                  value={sequence.email_body}
                  onChange={(e) => updateSequence(index, 'email_body', e.target.value)}
                  placeholder="Follow-up email content..."
                  rows={4}
                  className="bg-kg-card border-green-500/20 text-white"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-kg-card rounded">
                <Checkbox
                  checked={sequence.schedule_meeting || false}
                  onCheckedChange={(checked) => updateSequence(index, 'schedule_meeting', checked)}
                  className="border-[#555555] data-[state=checked]:bg-green-500/25 data-[state=checked]:border-green-500/40"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <Label className="text-white text-[18px] cursor-pointer" onClick={() => updateSequence(index, 'schedule_meeting', !sequence.schedule_meeting)}>
                      Auto-schedule meeting with AI
                    </Label>
                  </div>
                  <p className="text-gray-400 text-[18px] mt-1">
                    AI will find optimal meeting times and send calendar invites
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-400 text-[18px]">
          💡 Follow-ups are triggered manually. Go to the Leads page and click "Send Pending Follow-ups" to send emails that are due.
        </p>
      </div>
    </div>
  );
}