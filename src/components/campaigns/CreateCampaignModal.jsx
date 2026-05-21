import { Campaign } from '@/api/entities';
import {
  generateCampaignWithGrok,
  generateCampaignEmailCopy,
} from '@/api/campaignAi';
import { uploadFile } from '@/api/integrations';
import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Send,
  Upload,
  Trash2,
  Loader2,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FollowupSequenceEditor from './FollowupSequenceEditor';
import { useToast } from '@/components/ui/use-toast';

const EMPTY_FORM = {
  name: '',
  language: 'English',
  target_audience: '',
  email_subject: '',
  email_body: '',
  media_type: '',
  media_url: '',
  followup_sequences: [],
};

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [videoUrl, setVideoUrl] = useState('');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showGrokBrief, setShowGrokBrief] = useState(false);
  const [grokBrief, setGrokBrief] = useState('');
  const [subjectVariants, setSubjectVariants] = useState([]);
  const [keyMessages, setKeyMessages] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);
  const [grokRationale, setGrokRationale] = useState('');
  const [grokSource, setGrokSource] = useState(null);

  if (!isOpen) return null;

  const applyCampaignDraft = (campaign, meta) => {
    setFormData((prev) => ({
      ...prev,
      name: campaign.name || prev.name,
      language: campaign.language || prev.language,
      target_audience: campaign.target_audience || prev.target_audience,
      email_subject: campaign.email_subject || prev.email_subject,
      email_body: campaign.email_body || prev.email_body,
    }));
    setSubjectVariants(campaign.email_subjects || []);
    setKeyMessages(campaign.key_messages || []);
    setVideoIdeas(campaign.video_url_suggestions || []);
    setGrokRationale(campaign.rationale || '');
    setGrokSource(meta?.source || null);
    if (campaign.suggested_video_url) {
      setVideoUrl(campaign.suggested_video_url);
    }
  };

  const handleGenerateFullCampaign = async () => {
    const brief = grokBrief.trim();
    if (!brief) {
      toast({
        title: 'Describe your campaign',
        description: 'e.g. "Q1 2025 IoT Training Launch for automotive industry"',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingFull(true);
    try {
      const { campaign, meta } = await generateCampaignWithGrok({
        brief_description: brief,
        language: formData.language,
      });
      applyCampaignDraft(campaign, meta);
      setShowGrokBrief(false);
      toast({
        title: meta?.source === 'grok' ? 'Campaign generated with Grok' : 'Demo campaign draft ready',
        description: 'Review and edit all fields before saving.',
      });
    } catch (err) {
      toast({
        title: 'Grok generation failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingFull(false);
    }
  };

  const handleGenerateCopy = async () => {
    if (!formData.name?.trim() || !formData.target_audience?.trim()) {
      toast({
        title: 'Name and audience required',
        description: 'Fill in campaign name and target audience first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingCopy(true);
    try {
      const { campaign, meta } = await generateCampaignEmailCopy({
        name: formData.name,
        target_audience: formData.target_audience,
        language: formData.language,
      });
      setFormData((prev) => ({
        ...prev,
        email_subject: campaign.email_subject || prev.email_subject,
        email_body: campaign.email_body || prev.email_body,
      }));
      setSubjectVariants(campaign.email_subjects || []);
      setGrokSource(meta?.source || null);
      toast({
        title: 'Email copy updated',
        description:
          meta?.source === 'grok'
            ? 'Pick a subject variant below or edit the body.'
            : 'Demo copy — enable GROK_API_KEY_LUMEN for live Grok.',
      });
    } catch (err) {
      toast({
        title: 'Copy generation failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await uploadFile({ file });
      setFormData((prev) => ({
        ...prev,
        media_type: type,
        media_url: file_url,
      }));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = () => {
    setFormData((prev) => ({ ...prev, media_type: '', media_url: '' }));
    setVideoUrl('');
  };

  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      toast({ title: 'Enter a video URL', variant: 'destructive' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      media_type: 'video_url',
      media_url: videoUrl,
    }));
  };

  const handleSubmit = async () => {
    try {
      await Campaign.create({ ...formData, status: 'draft' });
      onSuccess();
      handleClose();
      toast({ title: 'Campaign created' });
    } catch {
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setVideoUrl('');
    setShowGrokBrief(false);
    setGrokBrief('');
    setSubjectVariants([]);
    setKeyMessages([]);
    setVideoIdeas([]);
    setGrokRationale('');
    setGrokSource(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-kg-card rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="sticky top-0 bg-kg-card border-b border-green-500/25 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-medium text-white">Create New Campaign</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Grok full campaign */}
          <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-4 space-y-3">
            <p className="text-sm text-gray-300">
              Describe your campaign in one sentence — Grok will draft name, audience, email,
              and video ideas (KG ProTech on-brand, no invented stats).
            </p>
            {!showGrokBrief ? (
              <Button
                type="button"
                onClick={() => setShowGrokBrief(true)}
                disabled={isGeneratingFull}
                variant="kg"
                className="w-full"
              >
                {isGeneratingFull ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating with Grok…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    ✨ Generate Campaign with Grok
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={grokBrief}
                  onChange={(e) => setGrokBrief(e.target.value)}
                  placeholder='e.g. "Q1 2025 IoT Training Launch for automotive OEM training centers"'
                  rows={3}
                  className="bg-kg-input border-green-500/20 text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleGenerateFullCampaign}
                    disabled={isGeneratingFull || !grokBrief.trim()}
                    variant="kg" className="flex-1"
                  >
                    {isGeneratingFull ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGrokBrief(false)}
                    className="border-green-500/20 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {grokSource && (
              <p className="text-sm text-gray-400 leading-relaxed">
                Source: {grokSource === 'grok' ? 'Grok AI' : 'Demo (set GROK_API_KEY_LUMEN)'}
              </p>
            )}
          </div>

          {grokRationale && (
            <p className="text-sm text-gray-400 italic border-l-2 border-green-500/40 pl-3">
              {grokRationale}
            </p>
          )}

          <div>
            <Label className="text-gray-300 mb-2">Campaign Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Q1 2025 IoT Training Launch"
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, language: val }))}
              >
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
            <div>
              <Label className="text-gray-300 mb-2">Target Audience</Label>
              <Input
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, target_audience: e.target.value }))
                }
                placeholder="Automotive engineers, fleet managers"
                className="bg-kg-input border-green-500/20 text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              onClick={handleGenerateCopy}
              disabled={isGeneratingCopy || isGeneratingFull}
              variant="kg"
            >
              {isGeneratingCopy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate Email with Grok
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isUploading}
              className="bg-kg-input hover:bg-[#444444] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading…' : 'Upload Image'}
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleMediaUpload(e, 'image')}
              className="hidden"
              id="image-upload"
              disabled={isUploading}
            />
            <Button
              type="button"
              onClick={() => document.getElementById('presentation-upload')?.click()}
              disabled={isUploading}
              className="bg-kg-input hover:bg-[#444444] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Presentation
            </Button>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={(e) => handleMediaUpload(e, 'presentation')}
              className="hidden"
              id="presentation-upload"
              disabled={isUploading}
            />
          </div>

          {subjectVariants.length > 0 && (
            <div>
              <Label className="text-gray-300 mb-2">Subject line options (Grok)</Label>
              <div className="flex flex-col gap-2">
                {subjectVariants.map((subj, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, email_subject: subj }))
                    }
                    className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                      formData.email_subject === subj
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-green-500/20 text-gray-300 hover:border-green-500/50'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-gray-300 mb-2">Email Subject</Label>
            <Input
              value={formData.email_subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email_subject: e.target.value }))
              }
              placeholder="Subject line"
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Email Body</Label>
            <Textarea
              value={formData.email_body}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email_body: e.target.value }))
              }
              placeholder="Email content"
              rows={10}
              className="bg-kg-input border-green-500/20 text-white font-mono text-sm"
            />
          </div>

          {(keyMessages.length > 0 || videoIdeas.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {keyMessages.length > 0 && (
                <div className="bg-kg-input rounded-lg p-4">
                  <Label className="text-gray-400 text-xs mb-2 block">Key messages</Label>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    {keyMessages.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
              {videoIdeas.length > 0 && (
                <div className="bg-kg-input rounded-lg p-4">
                  <Label className="text-gray-400 text-xs mb-2 block">Video ideas</Label>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    {videoIdeas.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-gray-300 mb-2">Video URL (YouTube, Vimeo, etc.)</Label>
            <div className="flex gap-2">
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-kg-input border-green-500/20 text-white"
              />
              <Button
                type="button"
                onClick={handleAddVideoUrl}
                className="bg-kg-input hover:bg-[#444444] text-white"
              >
                Add
              </Button>
            </div>
          </div>

          {formData.media_url && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-300">
                  Campaign{' '}
                  {formData.media_type === 'image'
                    ? 'Image'
                    : formData.media_type === 'presentation'
                      ? 'Presentation'
                      : 'Video'}
                </Label>
                <Button
                  type="button"
                  onClick={handleDeleteMedia}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
              {formData.media_type === 'image' && (
                <img
                  src={formData.media_url}
                  alt="Campaign"
                  className="w-full rounded-lg border-2 border-green-500/40"
                />
              )}
              {formData.media_type === 'presentation' && (
                <div className="p-4 bg-kg-input rounded-lg border-2 border-green-500/40 text-center">
                  <p className="text-white">📄 Presentation attached</p>
                  <a
                    href={formData.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 text-sm"
                  >
                    View file
                  </a>
                </div>
              )}
              {formData.media_type === 'video_url' && (
                <div className="p-4 bg-kg-input rounded-lg border-2 border-green-500/40">
                  <a
                    href={formData.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 text-sm break-all"
                  >
                    {formData.media_url}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-green-500/25 pt-6">
            <FollowupSequenceEditor
              sequences={formData.followup_sequences}
              onChange={(sequences) =>
                setFormData((prev) => ({ ...prev, followup_sequences: sequences }))
              }
              targetAudience={formData.target_audience}
              language={formData.language}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-green-500/25">
            <Button
              type="button"
              onClick={handleSubmit}
              variant="kg" className="flex-1"
              disabled={!formData.name?.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="border-green-500/20 text-gray-300 hover:bg-kg-input"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
