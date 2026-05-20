import { Campaign } from '@/api/entities';
import { invokeLLM, uploadFile } from '@/api/integrations';
import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Send, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FollowupSequenceEditor from './FollowupSequenceEditor';
import { useQuery } from '@tanstack/react-query';

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }) {
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
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list()
  });

  if (!isOpen) return null;

  const handleGenerateCopy = async () => {
    if (!formData.name || !formData.target_audience) {
      alert('Please fill in campaign name and target audience first');
      return;
    }
    
    setIsGeneratingCopy(true);
    try {
      const prompt = `Create a cold email for KG PROTECH. Product: Automatic Fault Simulator for vehicles via internet, enabling remote diagnostic training with 60% cost savings and reduced setup time.

      Campaign Name: ${formData.name}
      Target Audience: ${formData.target_audience}
      Language: ${formData.language}

      MANDATORY RULES (NEVER SKIP):
      1. EXTREMELY concise (2-3 short paragraphs maximum)
      2. Get straight to the point in first sentence
      3. Ask for a 15-minute webinar (not a sales pitch)
      4. Emphasize: 60% cost savings and reduced setup time
      5. Include this EXACT call-to-action at the end of email body (before signature):
      "📅 Schedule your 15-minute webinar: https://calendar.google.com/calendar/appointments/schedules/AcZssZ0H5P8VL5P_7YDKGZmLJZBQGgKpB5mTl8jC8yz8dXQr0YJZQ0?gv=true"
      6. Professional, direct tone

      End with this exact signature:
      Best regards,
      Cintia Kimura
      Founder and COO
      cintia@kgprotech.com
      Tel: +33 07 68 62 07 04

      Return the result in the following JSON format:
      {
      "subject": "email subject line here",
      "body": "email body content here with proper formatting"
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

      setFormData(prev => ({
        ...prev,
        email_subject: result.subject,
        email_body: result.body
      }));
    } catch (error) {
      alert('Failed to generate copy. Please try again.');
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
      await Campaign.create({
        ...formData,
        status: 'draft'
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert('Failed to create campaign');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="sticky top-0 bg-[#2a2a2a] border-b border-[#333333] p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
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
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Language</Label>
              <Select value={formData.language} onValueChange={(val) => setFormData(prev => ({ ...prev, language: val }))}>
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
            <div>
              <Label className="text-gray-300 mb-2">Target Audience</Label>
              <Input
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                placeholder="Automotive engineers, fleet managers"
                className="bg-[#333333] border-[#444444] text-white"
              />
            </div>
            </div>

            <div className="flex gap-3 flex-wrap">
            <Button
            onClick={handleGenerateCopy}
            disabled={isGeneratingCopy}
            className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium"
            >
            {isGeneratingCopy ? (
            <>Generating Copy...</>
            ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Copy with AI
            </>
            )}
            </Button>
            <Button
              onClick={() => document.getElementById('image-upload').click()}
              disabled={isUploading}
              className="bg-[#333333] hover:bg-[#444444] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
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
              onClick={() => document.getElementById('presentation-upload').click()}
              disabled={isUploading}
              className="bg-[#333333] hover:bg-[#444444] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Presentation'}
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

          <div>
            <Label className="text-gray-300 mb-2">Email Subject</Label>
            <Input
              value={formData.email_subject}
              onChange={(e) => setFormData(prev => ({ ...prev, email_subject: e.target.value }))}
              placeholder="Subject line"
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Email Body</Label>
            <Textarea
              value={formData.email_body}
              onChange={(e) => setFormData(prev => ({ ...prev, email_body: e.target.value }))}
              placeholder="Email content"
              rows={8}
              className="bg-[#333333] border-[#444444] text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Video URL (YouTube, Vimeo, etc.)</Label>
            <div className="flex gap-2">
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-[#333333] border-[#444444] text-white"
              />
              <Button
                onClick={handleAddVideoUrl}
                className="bg-[#333333] hover:bg-[#444444] text-white"
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
                  className="w-full rounded-lg border-2 border-[#00c600]"
                />
              )}
              {formData.media_type === 'presentation' && (
                <div className="p-4 bg-[#333333] rounded-lg border-2 border-[#00c600] text-center">
                  <p className="text-white">📄 Presentation attached</p>
                  <a href={formData.media_url} target="_blank" rel="noopener noreferrer" className="text-[#00c600] text-sm">
                    View file
                  </a>
                </div>
              )}
              {formData.media_type === 'video_url' && (
                <div className="p-4 bg-[#333333] rounded-lg border-2 border-[#00c600]">
                  <p className="text-white mb-2">🎥 Video URL:</p>
                  <a href={formData.media_url} target="_blank" rel="noopener noreferrer" className="text-[#00c600] text-sm break-all">
                    {formData.media_url}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-[#333333] pt-6">
            <FollowupSequenceEditor
              sequences={formData.followup_sequences}
              onChange={(sequences) => setFormData(prev => ({ ...prev, followup_sequences: sequences }))}
              targetAudience={formData.target_audience}
              language={formData.language}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#333333]">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium"
              disabled={!formData.name}
            >
              <Send className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#444444] text-gray-300 hover:bg-[#333333]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}