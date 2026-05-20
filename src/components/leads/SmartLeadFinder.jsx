import { Lead } from '@/api/entities';
import { findHighQualityLeads } from '@/api/integrations';
import {
  loadSearchTemplates,
  saveSearchTemplate,
  deleteSearchTemplate,
} from '@/lib/smartLeadFinderStorage';
import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Building2,
  Users,
  Globe2,
  Target,
  Loader2,
  CheckCircle2,
  Circle,
  Linkedin,
  MapPin,
  MessageSquareQuote,
  BookmarkPlus,
  UserPlus,
  ChevronDown,
  Trash2,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const TARGET_ROLE_OPTIONS = [
  'Head of Product Development',
  'Head of Product',
  'Training Manager',
  'L&D Manager',
  'Head of Learning & Development',
  'CTO',
  'VP Engineering',
  'Director of Operations',
  'Plant Manager',
  'Technical Training Lead',
  'Chief People Officer',
  'HR Director',
];

const COMPANY_SIZE_OPTIONS = [
  '50–200 employees',
  '200–500 employees',
  '500–1,000 employees',
  '1,000–5,000 employees',
  '5,000+ employees',
];

const PROGRESS_STEPS = [
  { key: 'searching_companies', label: 'Searching companies…' },
  { key: 'finding_decision_makers', label: 'Finding decision-makers…' },
  { key: 'analyzing_activity', label: 'Analyzing profiles…' },
  { key: 'evaluating_intent', label: 'Evaluating intent…' },
  { key: 'complete', label: 'Complete' },
];

const EMPTY_ICP = {
  industry: '',
  companySize: '500–1,000 employees',
  targetRoles: ['Head of Product Development', 'Training Manager'],
  geography: '',
  painPoints: '',
  focusCompanies: '',
};

function fitScoreColor(score) {
  if (score >= 9) return 'bg-[#00c600] text-[#212121]';
  if (score >= 7) return 'bg-emerald-600/90 text-white';
  if (score >= 5) return 'bg-amber-500/90 text-[#212121]';
  return 'bg-gray-500 text-white';
}

function leadToCreatePayload(lead) {
  return {
    full_name: lead.name,
    email: lead.email,
    company: lead.company,
    status: 'new',
    language_preference: 'English',
    notes: [
      `Title: ${lead.title}`,
      `Location: ${lead.location}`,
      `Fit score: ${lead.fitScore}/10`,
      `LinkedIn: ${lead.linkedinUrl}`,
      '',
      '--- Fit reasoning ---',
      lead.fitReasoning,
      '',
      '--- Recent activity ---',
      lead.recentActivity,
      '',
      '--- Suggested first message ---',
      lead.suggestedFirstMessage,
    ].join('\n'),
  };
}

export default function SmartLeadFinder({ isOpen, onClose, onSuccess }) {
  const [icp, setIcp] = useState(EMPTY_ICP);
  const [view, setView] = useState('form');
  const [progressKey, setProgressKey] = useState('');
  const [progressDetail, setProgressDetail] = useState('');
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [templates, setTemplates] = useState(() => loadSearchTemplates());
  const [templateName, setTemplateName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState('');

  const progressIndex = PROGRESS_STEPS.findIndex((s) => s.key === progressKey);
  const progressPercent = useMemo(() => {
    if (progressKey === 'complete') return 100;
    if (progressIndex < 0) return 0;
    return Math.round(((progressIndex + 1) / PROGRESS_STEPS.length) * 100);
  }, [progressKey, progressIndex]);

  if (!isOpen) return null;

  const toggleRole = (role) => {
    setIcp((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const handleSearch = async () => {
    if (!icp.industry?.trim() || !icp.geography?.trim() || icp.targetRoles.length === 0) {
      setError('Please set industry, geography, and at least one target role.');
      return;
    }
    setError('');
    setIsSearching(true);
    setView('loading');
    setLeads([]);
    setSelectedIds(new Set());
    setProgressKey('searching_companies');

    try {
      const result = await findHighQualityLeads(icp, {
        onProgress: (step, detail) => {
          setProgressKey(step);
          if (detail) setProgressDetail(detail);
        },
      });
      setLeads(result.leads || []);
      setMeta(result.meta);
      setSelectedIds(new Set((result.leads || []).filter((l) => l.fitScore >= 8).map((l) => l.id)));
      setView('results');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lead search failed');
      setView('form');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveTemplate = () => {
    const name = templateName.trim() || `${icp.industry} — ${icp.targetRoles[0]}`;
    saveSearchTemplate({ name, icp: { ...icp } });
    setTemplates(loadSearchTemplates());
    setTemplateName('');
  };

  const handleLoadTemplate = (tpl) => {
    setIcp({ ...EMPTY_ICP, ...tpl.icp });
    setShowTemplates(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportSelected = async () => {
    const toImport = leads.filter((l) => selectedIds.has(l.id));
    if (toImport.length === 0) {
      setError('Select at least one lead to import.');
      return;
    }
    setIsImporting(true);
    setError('');
    try {
      for (const lead of toImport) {
        await Lead.create(leadToCreatePayload(lead));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const inputClass = 'bg-[#333333] border-[#444444] text-white';

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-[#333333] shadow-2xl">
        <div className="sticky top-0 bg-[#2a2a2a] border-b border-[#333333] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00c600]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00c600]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Smart Lead Finder</h2>
              <p className="text-sm text-gray-400">
                Quality over quantity — real decision-makers with intent signals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom">
          {view === 'form' && (
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#444444] text-gray-300 justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <BookmarkPlus className="w-4 h-4" />
                      Saved search templates ({templates.length})
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {templates.length === 0 ? (
                    <p className="text-sm text-gray-500 px-1">No saved templates yet.</p>
                  ) : (
                    templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#333333] border border-[#444444]"
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadTemplate(tpl)}
                          className="text-left text-sm text-white hover:text-[#00c600]"
                        >
                          {tpl.name}
                          <span className="block text-xs text-gray-500">
                            {new Date(tpl.savedAt).toLocaleDateString()}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteSearchTemplate(tpl.id);
                            setTemplates(loadSearchTemplates());
                          }}
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#00c600]" />
                    Target industry / sector *
                  </Label>
                  <Input
                    value={icp.industry}
                    onChange={(e) => setIcp((p) => ({ ...p, industry: e.target.value }))}
                    placeholder="e.g. Automotive OEM, EV battery, Industrial IoT"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00c600]" />
                    Company size
                  </Label>
                  <Select
                    value={icp.companySize}
                    onValueChange={(v) => setIcp((p) => ({ ...p, companySize: v }))}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00c600]" />
                  Target roles * (multi-select)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_ROLE_OPTIONS.map((role) => {
                    const active = icp.targetRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? 'bg-[#00c600]/20 border-[#00c600] text-[#00c600]'
                            : 'bg-[#333333] border-[#444444] text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#00c600]" />
                  Geographic focus *
                </Label>
                <Input
                  value={icp.geography}
                  onChange={(e) => setIcp((p) => ({ ...p, geography: e.target.value }))}
                  placeholder="e.g. Germany, France, DACH · Detroit, Michigan"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#00c600]" />
                  Pain points / keywords they care about
                </Label>
                <Textarea
                  value={icp.painPoints}
                  onChange={(e) => setIcp((p) => ({ ...p, painPoints: e.target.value }))}
                  placeholder="e.g. technician training, EV diagnostics, reducing onboarding time, digital twin skilling"
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2">Optional: focus companies</Label>
                <Textarea
                  value={icp.focusCompanies}
                  onChange={(e) => setIcp((p) => ({ ...p, focusCompanies: e.target.value }))}
                  placeholder="Comma-separated list, e.g. Bosch, Continental, ZF"
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#333333]">
                <div className="flex-1 flex gap-2">
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name (optional)"
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveTemplate}
                    className="border-[#444444] text-gray-300 shrink-0"
                  >
                    <BookmarkPlus className="w-4 h-4 mr-1" />
                    Save template
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold sm:min-w-[200px]"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find high-quality leads
                </Button>
              </div>
            </div>
          )}

          {view === 'loading' && (
            <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-12 h-12 text-[#00c600] animate-spin mb-6" />
              <h3 className="text-lg font-semibold text-white mb-2">Research in progress</h3>
              <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
                Grok is searching companies, profiling decision-makers, and scoring intent from
                recent activity.
              </p>
              <div className="w-full max-w-md space-y-4">
                <Progress value={progressPercent} className="h-2 bg-[#333333]" />
                <ul className="space-y-2">
                  {PROGRESS_STEPS.map((step, i) => {
                    const done =
                      progressKey === 'complete' ||
                      progressIndex > i ||
                      (progressIndex === i && progressKey !== '');
                    const active = progressKey === step.key;
                    return (
                      <li
                        key={step.key}
                        className={`flex items-center gap-3 text-sm ${
                          active ? 'text-[#00c600]' : done ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 shrink-0" />
                        )}
                        {step.label}
                      </li>
                    );
                  })}
                </ul>
                {progressDetail && (
                  <p className="text-xs text-gray-500 text-center">{progressDetail}</p>
                )}
              </div>
            </div>
          )}

          {view === 'results' && (
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-white font-medium">
                    {leads.length} high-intent lead{leads.length !== 1 ? 's' : ''} found
                  </p>
                  {meta?.source === 'demo' && (
                    <p className="text-xs text-amber-400/90 mt-1">
                      Demo mode — set <code className="text-[#00c600]">VITE_GROK_API_KEY</code> for
                      live research
                    </p>
                  )}
                  {meta?.source === 'grok' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Researched {meta.companiesResearched} companies ·{' '}
                      {meta.candidatesReviewed} profiles reviewed
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setView('form')}
                    className="border-[#444444] text-gray-300"
                  >
                    Refine search
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setSelectedIds(
                        selectedIds.size === leads.length
                          ? new Set()
                          : new Set(leads.map((l) => l.id))
                      )
                    }
                    variant="outline"
                    className="border-[#444444] text-gray-300"
                  >
                    {selectedIds.size === leads.length ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {leads.map((lead) => (
                  <Card
                    key={lead.id}
                    className={`bg-[#333333] border transition-all ${
                      selectedIds.has(lead.id)
                        ? 'border-[#00c600] ring-1 ring-[#00c600]/30'
                        : 'border-[#444444]'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                          className="mt-1 border-[#555] data-[state=checked]:bg-[#00c600] data-[state=checked]:border-[#00c600]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                            <Badge className={fitScoreColor(lead.fitScore)}>
                              Fit {lead.fitScore}/10
                            </Badge>
                          </div>
                          <p className="text-sm text-[#00c600]">{lead.title}</p>
                          <p className="text-sm text-gray-400">{lead.company}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            {lead.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lead.location}
                              </span>
                            )}
                            {lead.linkedinUrl && (
                              <a
                                href={lead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-400 hover:underline"
                              >
                                <Linkedin className="w-3 h-3" />
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Why they fit
                        </p>
                        <p className="text-gray-300 leading-relaxed">{lead.fitReasoning}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Recent activity
                        </p>
                        <p className="text-gray-300 leading-relaxed">{lead.recentActivity}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#2a2a2a] border border-[#444444]">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                          <MessageSquareQuote className="w-3 h-3" />
                          Suggested first message
                        </p>
                        <p className="text-gray-200 italic leading-relaxed">
                          {lead.suggestedFirstMessage}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {view === 'results' && (
          <div className="shrink-0 border-t border-[#333333] p-4 flex flex-wrap gap-3 bg-[#252525]">
            <Button
              type="button"
              onClick={handleImportSelected}
              disabled={isImporting || selectedIds.size === 0}
              className="flex-1 bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold min-w-[200px]"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Import selected to Leads ({selectedIds.size})
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
        )}
      </div>
    </div>
  );
}
