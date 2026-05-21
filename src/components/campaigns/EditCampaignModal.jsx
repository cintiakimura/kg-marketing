import { Campaign, Lead } from '@/api/entities';
import { generateCampaignEmailCopy } from '@/api/campaignAi';
import { uploadFile } from '@/api/integrations';
import { useToast } from '@/components/ui/use-toast';
import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Send, Upload, Trash2, Save, Rocket, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateLeadModal from '../leads/CreateLeadModal';
import FollowupSequenceEditor from './FollowupSequenceEditor';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function EditCampaignModal({ isOpen, onClose, campaign, onSuccess, onLaunchClick }) {
  const [formData, setFormData] = useState({
    name: '',
    language: 'English',
    target_audience: '',
    email_subject: '',
    email_body: '',
    media_type: '',
    media_url: '',
    followup_sequences: []
  });
  const [videoUrl, setVideoUrl] = useState('');
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list()
  });
  
  React.useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        language: campaign.language || 'English',
        target_audience: campaign.target_audience || '',
        email_subject: campaign.email_subject || '',
        email_body: campaign.email_body || '',
        media_type: campaign.media_type || '',
        media_url: campaign.media_url || campaign.generated_image_url || '',
        followup_sequences: campaign.followup_sequences || []
      });
      if (campaign.media_type === 'video_url') {
        setVideoUrl(campaign.media_url || '');
      }
    }
  }, [campaign]);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  if (!isOpen || !campaign) return null;

  const handleGenerateCopy = async () => {
    if (!formData.name?.trim() || !formData.target_audience?.trim()) {
      toast({
        title: 'Name and audience required',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingCopy(true);
    try {
      const { campaign } = await generateCampaignEmailCopy({
        name: formData.name,
        target_audience: formData.target_audience,
        language: formData.language,
      });
      setFormData((prev) => ({
        ...prev,
        email_subject: campaign.email_subject || prev.email_subject,
        email_body: campaign.email_body || prev.email_body,
      }));
      toast({ title: 'Email copy updated with Grok' });
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
      setFormData(prev => ({
        ...prev,
        media_type: type,
        media_url: file_url
      }));
    } catch (error) {
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = () => {
    setFormData(prev => ({
      ...prev,
      media_type: '',
      media_url: ''
    }));
    setVideoUrl('');
  };

  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }
    setFormData(prev => ({
      ...prev,
      media_type: 'video_url',
      media_url: videoUrl
    }));
  };

  const handleSubmit = async () => {
    try {
      await Campaign.update(campaign.id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Failed to update campaign');
    }
  };

  const handleLaunch = async () => {
    await handleSubmit();
    onLaunchClick({ ...campaign, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-kg-card rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="sticky top-0 bg-kg-card border-b border-green-500/25 p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">Edit Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <Label className="text-gray-300 mb-2">Campaign Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Q1 2025 IoT Training Launch"
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Language</Label>
              <Select value={formData.language} onValueChange={(val) => setFormData(prev => ({ ...prev, language: val }))}>
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
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                placeholder="Automotive engineers, fleet managers"
                className="bg-kg-input border-green-500/20 text-white"
              />
            </div>
            </div>

            <div className="flex gap-3 flex-wrap">
            <Button
            onClick={handleGenerateCopy}
            disabled={isGeneratingCopy}
            variant="kg"
            >
            {isGeneratingCopy ? (
            <>Generating Copy...</>
            ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate Copy
            </>
            )}
            </Button>
            <Button
              onClick={() => document.getElementById('edit-image-upload').click()}
              disabled={isUploading}
              className="kg-btn-surface inline-flex items-center gap-2 px-4 py-2 h-11"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleMediaUpload(e, 'image')}
              className="hidden"
              id="edit-image-upload"
              disabled={isUploading}
            />
            <Button
              onClick={() => document.getElementById('edit-presentation-upload').click()}
              disabled={isUploading}
              className="kg-btn-surface inline-flex items-center gap-2 px-4 py-2 h-11"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Presentation'}
            </Button>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={(e) => handleMediaUpload(e, 'presentation')}
              className="hidden"
              id="edit-presentation-upload"
              disabled={isUploading}
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Email Subject</Label>
            <Input
              value={formData.email_subject}
              onChange={(e) => setFormData(prev => ({ ...prev, email_subject: e.target.value }))}
              placeholder="Subject line"
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Email Body</Label>
            <Textarea
              value={formData.email_body}
              onChange={(e) => setFormData(prev => ({ ...prev, email_body: e.target.value }))}
              placeholder="Email content"
              rows={8}
              className="bg-kg-input border-green-500/20 text-white"
            />
          </div>

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
                onClick={handleAddVideoUrl}
               
              >
                Add
              </Button>
            </div>
          </div>

          {formData.media_url && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-300">
                  Campaign {formData.media_type === 'image' ? 'Image' : 
                           formData.media_type === 'presentation' ? 'Presentation' : 'Video'}
                </Label>
                <Button
                  onClick={handleDeleteMedia}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
                  <a href={formData.media_url} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm">
                    View file
                  </a>
                </div>
              )}
              {formData.media_type === 'video_url' && (
                <div className="p-4 bg-kg-input rounded-lg border-2 border-green-500/40">
                  <p className="text-white mb-2">🎥 Video URL:</p>
                  <a href={formData.media_url} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm break-all">
                    {formData.media_url}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-green-500/25 pt-6">
            <FollowupSequenceEditor
              sequences={formData.followup_sequences}
              onChange={(sequences) => setFormData(prev => ({ ...prev, followup_sequences: sequences }))}
              targetAudience={formData.target_audience}
              language={formData.language}
            />
          </div>

          <div className="flex gap-3 pt-4 p-4 -mx-6 -mb-6 mt-4 border-t border-green-500/25 bg-kg-input">
            <Button
              onClick={() => setIsCreateLeadModalOpen(true)}
              className="kg-btn-surface inline-flex items-center gap-2 px-4 py-2 h-11"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
            <Button
              onClick={handleSubmit}
              variant="kg" className="flex-1"
              disabled={!formData.name}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            {(campaign?.status === 'draft' || campaign?.status === 'active') && (
              <Button
                onClick={handleLaunch}
                variant="kg" className="flex-1"
                disabled={!formData.name}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Select Recipients & Launch
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="kg"
            >
              Cancel
            </Button>
            </div>
            </div>
            </div>

            <CreateLeadModal
            isOpen={isCreateLeadModalOpen}
            onClose={() => setIsCreateLeadModalOpen(false)}
            onSuccess={() => {
            queryClient.invalidateQueries(['leads']);
            setIsCreateLeadModalOpen(false);
            }}
            />
            </div>
            );
            }