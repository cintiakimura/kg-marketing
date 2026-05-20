import React, { useState, useEffect } from 'react';
import { updateLead } from '@/api/leads';
import { parseLeadNotes } from '@/lib/parseLeadNotes';
import {
  PIPELINE_STATUSES,
  isSmartFinderLead,
  normalizeLeadStatus,
} from '@/lib/leadConstants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  X,
  Save,
  Copy,
  Linkedin,
  MapPin,
  Mail,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function LeadDetailModal({ isOpen, onClose, lead, onSuccess }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('new');
  const [userNotes, setUserNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [finderSections, setFinderSections] = useState(null);

  const smartSections = isSmartFinderLead(lead);
  const parsed = finderSections || parseLeadNotes(lead?.notes);

  useEffect(() => {
    if (!lead) return;
    setStatus(normalizeLeadStatus(lead.status));
    const p = parseLeadNotes(lead.notes);
    setUserNotes(
      lead.my_notes ?? p.userNotes ?? (smartSections ? '' : lead.notes || '')
    );
    setFinderSections(smartSections ? p : null);
    setNextFollowUp(
      (lead.my_next_followup_date || lead.next_followup_date)
        ? String(lead.my_next_followup_date || lead.next_followup_date).slice(0, 10)
        : ''
    );
  }, [lead, smartSections]);

  if (!isOpen || !lead) return null;

  const handleCopyMessage = async () => {
    const text = parsed.suggestedMessage || '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let notesPayload = userNotes;
      if (finderSections) {
        notesPayload = [
          userNotes,
          finderSections.verificationNotes &&
            `--- Verification notes ---\n${finderSections.verificationNotes}`,
          finderSections.fitReasoning &&
            `--- Fit reasoning ---\n${finderSections.fitReasoning}`,
          finderSections.recentActivity &&
            `--- Recent activity ---\n${finderSections.recentActivity}`,
          finderSections.suggestedMessage &&
            `--- Suggested first message ---\n${finderSections.suggestedMessage}`,
        ]
          .filter(Boolean)
          .join('\n\n');
      }

      const updates = {
        status,
        notes: notesPayload,
        personal_notes: userNotes,
        personal_next_followup_date: nextFollowUp || null,
      };
      if (status !== normalizeLeadStatus(lead.status)) {
        updates.last_status_change = new Date().toISOString();
        if (status === 'contacted') {
          updates.last_contact_at = new Date().toISOString();
        }
      }
      await updateLead(lead.id, updates);
      toast({ title: 'Lead saved' });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'bg-[#333333] border-[#444444] text-white';

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-[#333333] shadow-2xl">
        <div className="shrink-0 border-b border-[#333333] px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{lead.full_name}</h2>
              {isSmartFinderLead(lead) && (
                <Badge className="bg-[#00c600]/20 text-[#00c600] border-[#00c600]/40">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Imported from Smart Finder
                </Badge>
              )}
              {lead.fit_score != null && (
                <Badge className="bg-[#00c600] text-[#212121]">Fit {lead.fit_score}/10</Badge>
              )}
            </div>
            <p className="text-[#00c600] text-sm">{lead.title || '—'}</p>
            <p className="text-gray-400 text-sm">{lead.company || '—'}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {lead.email}
                </span>
              )}
              {lead.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {lead.location}
                </span>
              )}
              {lead.linkedin_url && (
                <a
                  href={lead.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-custom">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00c600]" />
                Next follow-up date
              </Label>
              <Input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {parsed.suggestedMessage && (
            <div className="p-4 rounded-lg bg-[#333333] border border-[#444444]">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wide">
                  Suggested first message
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyMessage}
                  className="text-[#00c600] hover:text-[#00dd00]"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-gray-200 text-sm italic leading-relaxed">
                {parsed.suggestedMessage}
              </p>
            </div>
          )}

          {parsed.verificationNotes && (
            <div className="p-4 rounded-lg bg-[#00c600]/5 border border-[#00c600]/20">
              <Label className="text-gray-400 text-xs uppercase tracking-wide flex items-center gap-1 mb-2">
                <ShieldCheck className="w-3 h-3 text-[#00c600]" />
                Verification notes (read-only)
              </Label>
              <p className="text-gray-400 text-sm leading-relaxed">{parsed.verificationNotes}</p>
            </div>
          )}

          {parsed.fitReasoning && (
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                Fit reasoning (read-only)
              </Label>
              <p className="text-gray-300 text-sm leading-relaxed bg-[#333333] p-3 rounded-lg border border-[#444444]">
                {parsed.fitReasoning}
              </p>
            </div>
          )}

          {parsed.recentActivity && (
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                Recent activity (read-only)
              </Label>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-[#333333] p-3 rounded-lg border border-[#444444]">
                {parsed.recentActivity}
              </p>
            </div>
          )}

          <div>
            <Label className="text-gray-300 mb-2">Your notes (only you see these)</Label>
            <Textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={6}
              placeholder="Call notes, next steps, objections..."
              className={inputClass}
            />
            <p className="text-xs text-gray-600 mt-1">
              Your follow-up notes. Smart Finder research blocks above are preserved on save.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#333333] p-4 flex gap-3 bg-[#252525]">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-[#444444] text-gray-300"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
