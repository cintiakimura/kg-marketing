import { findHighQualityLeads } from '@/api/integrations';
import { createLeadsBulk } from '@/api/leads';
import {
  loadSearchTemplates,
  saveSearchTemplate,
  deleteSearchTemplate,
} from '@/lib/smartLeadFinderStorage';
import { useToast } from '@/components/ui/use-toast';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ShieldCheck,
  ExternalLink,
  ScrollText,
  Wand2,
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

/** Most relevant roles for automotive training materials & tools — shown first. */
export const PRIMARY_TARGET_ROLES = [
  'Training Manager',
  'Aftersales Training Manager',
  'Head of Learning & Development',
  'Technical Training Manager',
];

export const TARGET_ROLE_OPTIONS = [
  ...PRIMARY_TARGET_ROLES,
  'Service Training Manager',
  'L&D Manager',
  'Director of Training',
  'Fleet Training Manager',
  'Vocational Training Coordinator',
  'Service Manager',
  'Parts & Service Director',
  'Fixed Operations Manager',
  'Head of Product Development',
  'Talent Development Manager',
  'Lead Technical Instructor',
];

const COMPANY_SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-1000',
  '1000+',
];

const PROGRESS_STEPS = [
  { key: 'searching_companies', label: 'Finding relevant companies…' },
  { key: 'finding_decision_makers', label: 'Researching decision-makers…' },
  { key: 'analyzing_activity', label: 'Analyzing recent activity…' },
  { key: 'evaluating_fit', label: 'Evaluating fit…' },
  { key: 'complete', label: 'Complete' },
];

const EMPTY_ICP = {
  industry: '',
  companySize: '51-200',
  targetRoles: [
    'Training Manager',
    'Aftersales Training Manager',
    'Head of Learning & Development',
    'Technical Training Manager',
  ],
  geography: '',
  painPoints: '',
  customPrompt: '',
  focusCompanies: '',
};

function confidenceBadgeClass(level) {
  if (level === 'high') return 'bg-kg-btn/20 text-green-400 border-green-500/40';
  if (level === 'medium') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function activityBullets(text) {
  if (!text) return [];
  return text
    .split(/\n|•/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fitScoreColor(score) {
  if (score >= 9) return 'bg-kg-btn text-white font-semibold';
  if (score >= 7) return 'bg-emerald-600/90 text-white';
  if (score >= 5) return 'bg-amber-500/90 text-white';
  return 'bg-gray-500 text-white';
}

function leadEmail(lead) {
  if (lead.email?.trim()) return lead.email.trim();
  const slug = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '.');
  const co = (lead.company || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${slug}@${co}.pending-import`;
}

function leadToCreatePayload(lead) {
  return {
    full_name: lead.name,
    email: leadEmail(lead),
    company: lead.company,
    title: lead.title,
    linkedin_url: lead.linkedinUrl || null,
    location: lead.location || null,
    fit_score: lead.fitScore,
    source: 'smart_lead_finder',
    status: 'new',
    language_preference: 'English',
    notes: [
      `Confidence: ${lead.confidence_level || 'medium'}`,
      '',
      '--- Verification notes ---',
      lead.verificationNotes || lead.verification_notes || '—',
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
  const { toast } = useToast();
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
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [appliedCustomPrompt, setAppliedCustomPrompt] = useState('');

  const progressIndex = PROGRESS_STEPS.findIndex((s) => s.key === progressKey);
  const progressPercent = useMemo(() => {
    if (progressKey === 'complete') return 100;
    if (progressIndex < 0) return 0;
    return Math.round(((progressIndex + 1) / PROGRESS_STEPS.length) * 100);
  }, [progressKey, progressIndex]);

  const toggleRole = (role) => {
    setIcp((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const hasFullCustomPrompt = Boolean(icp.customPrompt?.trim());
  const hasStructuredIcp =
    Boolean(icp.industry?.trim()) &&
    Boolean(icp.geography?.trim()) &&
    icp.targetRoles.length > 0;

  const handleSearch = async () => {
    if (!hasFullCustomPrompt && !hasStructuredIcp) {
      setError(
        'Fill in the structured fields (industry, geography, roles) — or write a full custom prompt below.'
      );
      return;
    }
    setError('');
    setIsSearching(true);
    setView('loading');
    setLeads([]);
    setSelectedIds(new Set());
    setImportDone(false);
    setAppliedCustomPrompt(icp.customPrompt?.trim() || '');
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
      const payloads = toImport.map(leadToCreatePayload);
      const { created, errors } = await createLeadsBulk(payloads);
      setImportedCount(created.length);
      setImportDone(true);
      toast({
        title: `${created.length} lead${created.length !== 1 ? 's' : ''} imported`,
        description:
          errors.length > 0
            ? `${errors.length} failed — check API URL and database connection.`
            : 'Verified leads are now in your database.',
      });
      onSuccess?.();
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearForm = () => {
    setIcp({ ...EMPTY_ICP });
    setError('');
  };

  const inputClass =
    'bg-kg-raised border-green-500/20 text-white text-[13px] leading-relaxed rounded-xl';

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="bg-kg-card rounded-xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-green-500/25 shadow-2xl"
      >
        <div className="sticky top-0 bg-kg-card border-b border-green-500/25 px-6 md:px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kg-btn/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white">Smart Lead Finder</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Up to 12 verified decision-makers — evidence-backed, anti-hallucination research
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

              <div className="flex items-start gap-3 p-4 rounded-lg bg-kg-btn/5 border border-green-500/25">
                <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  Grok uses multi-step web + X search, then a verification pass. Leads without
                  solid sources, LinkedIn evidence, or recent activity are discarded — never invented.
                </p>
              </div>

              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Option 1 — Structured search
              </p>

              <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-500/20 text-gray-300 justify-between"
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
                        className="flex items-center justify-between p-3 rounded-lg bg-kg-raised border border-green-500/20"
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadTemplate(tpl)}
                          className="text-left text-sm text-white hover:text-green-400"
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
                    <Building2 className="w-4 h-4 text-green-400" />
                    Target industry / sector {hasFullCustomPrompt ? '' : '*'}
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
                    <Users className="w-4 h-4 text-green-400" />
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
                <Label className="text-gray-300 mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Target roles {hasFullCustomPrompt ? '' : '*'} (multi-select)
                </Label>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Roles responsible for purchasing training materials, simulators, and tools in
                  automotive schools, OEM aftersales departments, dealerships, and resellers.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_ROLE_OPTIONS.map((role) => {
                    const active = icp.targetRoles.includes(role);
                    const isPrimary = PRIMARY_TARGET_ROLES.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          active
                            ? 'bg-kg-btn/20 border-green-500/40 text-green-400 font-semibold'
                            : isPrimary
                              ? 'bg-kg-btn/5 border-green-500/60 text-gray-200 font-semibold hover:border-green-500/40 hover:text-green-400'
                              : 'bg-kg-raised border-green-500/20 text-gray-400 font-medium hover:border-gray-500'
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
                  <Globe2 className="w-4 h-4 text-green-400" />
                  Geographic focus {hasFullCustomPrompt ? '' : '*'}
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
                  <Brain className="w-4 h-4 text-green-400" />
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

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-green-500/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-kg-card px-4 text-sm font-semibold text-green-400 uppercase tracking-wider">
                    or
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-xl border-2 border-green-500/50 bg-gradient-to-b from-kg-btn/10 to-kg-raised/90 shadow-lg shadow-green-500/15">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-kg-btn/25 flex items-center justify-center shrink-0">
                    <Wand2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <Label className="text-white text-base font-medium block">
                      Or write your full custom prompt here (optional but powerful)
                    </Label>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                      Maximum control: describe exactly who you want in plain language. When filled,
                      Grok treats this as the <strong className="text-green-400">primary directive</strong>{' '}
                      — you can use this alone or combine it with the structured fields above.
                    </p>
                  </div>
                </div>
                <Textarea
                  value={icp.customPrompt}
                  onChange={(e) => setIcp((p) => ({ ...p, customPrompt: e.target.value }))}
                  placeholder="Find Training Managers or Aftersales Training Managers at automotive OEMs in Germany who recently posted about technician upskilling, diagnostic training, or L&D tooling..."
                  rows={10}
                  className={`${inputClass} min-h-[220px] text-[13px] leading-relaxed border-green-500/40 focus-visible:ring-2 focus-visible:ring-green-500/50 py-4`}
                />
                {hasFullCustomPrompt && (
                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    Full custom prompt will be prioritized in research
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-green-500/25">
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
                    className="border-green-500/20 text-gray-300 shrink-0"
                  >
                    <BookmarkPlus className="w-4 h-4 mr-1" />
                    Save template
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  disabled={isSearching}
                  className="border-green-500/20 text-gray-300"
                >
                  Clear form
                </Button>
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  variant="kg"
                  className="sm:min-w-[220px]"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find high-quality leads
                </Button>
              </div>
            </div>
          )}

          {view === 'loading' && (
            <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-12 h-12 text-green-400 animate-spin mb-6" />
              <h3 className="text-lg font-semibold text-white mb-2">Research in progress</h3>
              <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
                Four-phase research: companies → decision-makers → recent activity → fit scoring
                with source verification.
              </p>
              <div className="w-full max-w-md space-y-4">
                <Progress value={progressPercent} className="h-2 bg-kg-raised" />
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
                          active ? 'text-green-400' : done ? 'text-gray-300' : 'text-gray-600'
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-white font-medium">
                      {leads.length} high-intent lead{leads.length !== 1 ? 's' : ''} found
                    </p>
                    {(appliedCustomPrompt || meta?.customPromptApplied) && (
                      <Badge
                        variant="outline"
                        className="bg-kg-btn/10 text-green-400 border-green-500/40 text-xs"
                        title={appliedCustomPrompt}
                      >
                        <ScrollText className="w-3 h-3 mr-1 inline" />
                        {appliedCustomPrompt.length > 60
                          ? 'Full custom prompt applied'
                          : 'Custom instructions applied'}
                      </Badge>
                    )}
                  </div>
                  {appliedCustomPrompt && (
                    <p className="text-xs text-gray-500 mt-1 max-w-xl line-clamp-2">
                      “{appliedCustomPrompt}”
                    </p>
                  )}
                  {meta?.source === 'demo' && (
                    <p className="text-xs text-amber-400/90 mt-1">
                      Demo mode — set <code className="text-green-400">GROK_API_KEY_LUMEN</code> on
                      backend or <code className="text-green-400">VITE_KG_MARKETING_API_URL</code>
                    </p>
                  )}
                  {meta?.source === 'grok' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {meta.companiesResearched ?? 0} companies ·{' '}
                      {meta.candidatesReviewed ?? 0} candidates ·{' '}
                      {meta.leadsReturned ?? leads.length} passed verification
                      {meta.quality_summary ? ` — ${meta.quality_summary}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setView('form')}
                    className="border-green-500/20 text-gray-300"
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
                    variant="kgMuted"
                  >
                    {selectedIds.size === leads.length ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-1">
                {leads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                  <Card
                    className={`bg-kg-raised border transition-all ${
                      selectedIds.has(lead.id)
                        ? 'border-green-500/40 ring-1 ring-green-500/30'
                        : 'border-green-500/20'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                          className="mt-1 border-[#555] data-[state=checked]:bg-kg-btn data-[state=checked]:border-green-500/40"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                            <Badge className={fitScoreColor(lead.fitScore)}>
                              Fit {lead.fitScore}/10
                            </Badge>
                            {lead.confidence_level && (
                              <Badge
                                variant="outline"
                                className={confidenceBadgeClass(lead.confidence_level)}
                              >
                                {lead.confidence_level} confidence
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-green-400">{lead.title}</p>
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
                        <ul className="text-gray-300 leading-relaxed space-y-1 list-none">
                          {activityBullets(lead.recentActivity).map((bullet) => (
                            <li key={bullet.slice(0, 40)} className="flex gap-2">
                              <span className="text-green-400 shrink-0">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-kg-card border border-green-500/20">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                          <MessageSquareQuote className="w-3 h-3" />
                          Suggested first message
                        </p>
                        <p className="text-gray-200 italic leading-relaxed">
                          {lead.suggestedFirstMessage}
                        </p>
                      </div>
                      {(lead.verificationNotes || lead.verification_notes) && (
                        <div className="p-3 rounded-lg bg-kg-btn/5 border border-green-500/20">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-green-400" />
                            Verification notes
                          </p>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            {lead.verificationNotes || lead.verification_notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {view === 'results' && (
          <div className="shrink-0 border-t border-green-500/25 p-4 flex flex-wrap gap-3 bg-[#252525]">
            {importDone ? (
              <>
                <p className="w-full text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {importedCount} lead{importedCount !== 1 ? 's' : ''} saved to your database.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  variant="kg" className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Leads list
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleImportSelected}
                disabled={isImporting || selectedIds.size === 0}
                variant="kg" className="flex-1 min-w-[200px]"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Import Selected Leads to Database ({selectedIds.size})
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-green-500/20 text-gray-300"
            >
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
