import { Campaign } from '@/api/entities';
import { invokeLLM, generateImage } from '@/api/integrations';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function AIMediaSuggestion({ campaigns, onSuggestionApplied }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const handleGenerateSuggestion = async () => {
    setIsGenerating(true);
    try {
      // Analyze past campaign performance
      const campaignPerformance = campaigns
        .filter(c => c.sent_count > 0)
        .map(c => ({
          name: c.name,
          media_type: c.media_type || 'none',
          sent_count: c.sent_count || 0,
          has_media: !!c.media_url
        }));

      const prompt = `You are an AI marketing analyst for KG PROTECH, analyzing campaign performance data.

Historical Campaign Data:
${JSON.stringify(campaignPerformance, null, 2)}

Product: IoT Automatic Fault Simulator for automotive training
Target: Automotive engineers, training centers, fleet managers

TASK: Based on the historical performance data, recommend the most effective media type for the next campaign.

Consider:
1. Which media types (image, video, presentation) had higher engagement
2. Campaigns with media vs without media
3. Industry best practices for B2B automotive/training products

Return JSON with:
{
  "recommended_media": "image" | "video_url" | "presentation" | "none",
  "reason": "brief explanation why this media type works best",
  "image_prompt": "detailed prompt for image generation if recommending image, otherwise null"
}`;

      const result = await invokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_media: { type: "string" },
            reason: { type: "string" },
            image_prompt: { type: ["string", "null"] }
          }
        }
      });

      setSuggestion(result);
    } catch (error) {
      alert('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = async () => {
    if (!suggestion) return;

    if (suggestion.recommended_media === 'image' && suggestion.image_prompt) {
      setIsGenerating(true);
      try {
        const imageResult = await generateImage({
          prompt: suggestion.image_prompt
        });

        onSuggestionApplied({
          media_type: 'image',
          media_url: imageResult.url,
          reason: suggestion.reason
        });

        setSuggestion(null);
      } catch (error) {
        alert('Failed to generate image. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    } else {
      onSuggestionApplied({
        media_type: suggestion.recommended_media,
        reason: suggestion.reason
      });
      setSuggestion(null);
    }
  };

  return (
    <div className="p-4 bg-kg-input rounded-lg border border-green-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-white font-medium text-[18px]">AI Media Recommendation</span>
        </div>
        <Button
          onClick={handleGenerateSuggestion}
          disabled={isGenerating || campaigns.length === 0}
          size="sm"
          variant="kgAi"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {isGenerating ? 'Analyzing...' : 'Get Suggestion'}
        </Button>
      </div>

      {suggestion && (
        <div className="space-y-3">
          <div className="p-3 bg-kg-card rounded border border-green-500/30">
            <p className="text-green-400 font-medium text-[18px] mb-1">
              Recommended: {suggestion.recommended_media === 'none' ? 'No Media' : suggestion.recommended_media.replace('_', ' ').toUpperCase()}
            </p>
            <p className="text-gray-300 text-[18px]">{suggestion.reason}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleApplySuggestion}
              disabled={isGenerating}
              size="sm"
              className="flex-1 bg-kg-btn hover:bg-kg-btn-hover text-white"
            >
              {isGenerating ? 'Applying...' : 'Apply Suggestion'}
            </Button>
            <Button
              onClick={() => setSuggestion(null)}
              size="sm"
              variant="outline"
              className="border-green-500/20 text-gray-300 hover:bg-kg-input"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {!suggestion && campaigns.length === 0 && (
        <p className="text-gray-400 text-[18px]">
          Create and launch some campaigns first to get AI-powered media recommendations
        </p>
      )}
    </div>
  );
}