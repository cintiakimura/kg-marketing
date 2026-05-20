import { Campaign } from '@/api/entities';
import { invokeLLM } from '@/api/integrations';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Clock, FileText, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIABTestSuggestion({ campaigns, currentCampaign, onVariantApplied }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      // Analyze historical campaign performance
      const performanceData = campaigns
        .filter(c => c.sent_count > 0)
        .map(c => ({
          name: c.name,
          subject: c.email_subject,
          body_length: (c.email_body || '').length,
          language: c.language,
          media_type: c.media_type,
          sent_count: c.sent_count,
          open_rate: c.open_rate || 0,
          click_rate: c.click_rate || 0,
          conversion_rate: c.conversion_rate || 0,
          send_time: c.send_time || 'unknown'
        }));

      const prompt = `You are an AI marketing optimization specialist for KG PROTECH analyzing campaign performance data.

Historical Campaign Performance:
${JSON.stringify(performanceData, null, 2)}

Current Campaign:
- Subject: ${currentCampaign.email_subject || 'Not set'}
- Body Preview: ${(currentCampaign.email_body || '').substring(0, 200)}...
- Language: ${currentCampaign.language}
- Target: ${currentCampaign.target_audience || 'Not specified'}

Product: IoT Automatic Fault Simulator for automotive training

TASK: Based on historical performance, create A/B test variations to optimize:
1. Subject line effectiveness
2. Email content structure
3. Optimal send time

Consider:
- Which subject line patterns had higher open rates
- Which content lengths/structures had better click rates
- Which send times had better engagement
- Language-specific preferences
- B2B best practices for automotive/training industry

Return JSON with 3 A/B test suggestions:
{
  "subject_line_test": {
    "variant_a": "subject line option A",
    "variant_b": "subject line option B",
    "hypothesis": "why this test matters",
    "expected_improvement": "percentage estimate"
  },
  "content_test": {
    "variant_a": "content approach A description",
    "variant_b": "content approach B description",
    "hypothesis": "why this test matters",
    "expected_improvement": "percentage estimate"
  },
  "timing_test": {
    "variant_a": "optimal send time A (e.g., Tuesday 10:00 AM)",
    "variant_b": "optimal send time B (e.g., Thursday 2:00 PM)",
    "hypothesis": "why this test matters",
    "expected_improvement": "percentage estimate"
  }
}`;

      const result = await invokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject_line_test: {
              type: "object",
              properties: {
                variant_a: { type: "string" },
                variant_b: { type: "string" },
                hypothesis: { type: "string" },
                expected_improvement: { type: "string" }
              }
            },
            content_test: {
              type: "object",
              properties: {
                variant_a: { type: "string" },
                variant_b: { type: "string" },
                hypothesis: { type: "string" },
                expected_improvement: { type: "string" }
              }
            },
            timing_test: {
              type: "object",
              properties: {
                variant_a: { type: "string" },
                variant_b: { type: "string" },
                hypothesis: { type: "string" },
                expected_improvement: { type: "string" }
              }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      alert('Failed to generate A/B test suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySubjectVariant = (variant) => {
    if (suggestions?.subject_line_test && onVariantApplied) {
      const subject = variant === 'A' ? suggestions.subject_line_test.variant_a : suggestions.subject_line_test.variant_b;
      onVariantApplied({ 
        email_subject: subject,
        ab_test_variant: variant
      });
      setSuggestions(null);
    }
  };

  return (
    <div className="p-4 bg-[#333333] rounded-lg border border-[#444444]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00c600]" />
          <span className="text-white font-medium text-sm">AI A/B Testing Optimizer</span>
        </div>
        <Button
          onClick={handleGenerateSuggestions}
          disabled={isGenerating || campaigns.length === 0}
          size="sm"
          className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121]"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {isGenerating ? 'Analyzing...' : 'Generate Tests'}
        </Button>
      </div>

      {suggestions && (
        <div className="space-y-4">
          {/* Subject Line Test */}
          <div className="p-3 bg-[#2a2a2a] rounded border border-[#00c600]/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-[#00c600]" />
              <span className="text-white font-medium text-sm">Subject Line Test</span>
              <Badge className="bg-[#00c600]/20 text-[#00c600] border-0 text-xs">
                +{suggestions.subject_line_test.expected_improvement}
              </Badge>
            </div>
            <p className="text-gray-400 text-xs mb-3">{suggestions.subject_line_test.hypothesis}</p>
            <div className="space-y-2">
              <div className="p-2 bg-[#333333] rounded border border-[#555555]">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">Variant A</Badge>
                  <Button
                    onClick={() => applySubjectVariant('A')}
                    size="sm"
                    variant="ghost"
                    className="text-[#00c600] hover:text-[#00dd00] hover:bg-[#00c600]/10 h-6 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-white text-xs">{suggestions.subject_line_test.variant_a}</p>
              </div>
              <div className="p-2 bg-[#333333] rounded border border-[#555555]">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">Variant B</Badge>
                  <Button
                    onClick={() => applySubjectVariant('B')}
                    size="sm"
                    variant="ghost"
                    className="text-[#00c600] hover:text-[#00dd00] hover:bg-[#00c600]/10 h-6 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-white text-xs">{suggestions.subject_line_test.variant_b}</p>
              </div>
            </div>
          </div>

          {/* Content Test */}
          <div className="p-3 bg-[#2a2a2a] rounded border border-[#00c600]/30">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-[#00c600]" />
              <span className="text-white font-medium text-sm">Content Structure Test</span>
              <Badge className="bg-[#00c600]/20 text-[#00c600] border-0 text-xs">
                +{suggestions.content_test.expected_improvement}
              </Badge>
            </div>
            <p className="text-gray-400 text-xs mb-3">{suggestions.content_test.hypothesis}</p>
            <div className="space-y-2">
              <div className="p-2 bg-[#333333] rounded">
                <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs mb-1">Variant A</Badge>
                <p className="text-white text-xs">{suggestions.content_test.variant_a}</p>
              </div>
              <div className="p-2 bg-[#333333] rounded">
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs mb-1">Variant B</Badge>
                <p className="text-white text-xs">{suggestions.content_test.variant_b}</p>
              </div>
            </div>
          </div>

          {/* Timing Test */}
          <div className="p-3 bg-[#2a2a2a] rounded border border-[#00c600]/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#00c600]" />
              <span className="text-white font-medium text-sm">Send Time Optimization</span>
              <Badge className="bg-[#00c600]/20 text-[#00c600] border-0 text-xs">
                +{suggestions.timing_test.expected_improvement}
              </Badge>
            </div>
            <p className="text-gray-400 text-xs mb-3">{suggestions.timing_test.hypothesis}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#333333] rounded text-center">
                <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs mb-1">Variant A</Badge>
                <p className="text-white text-xs font-medium">{suggestions.timing_test.variant_a}</p>
              </div>
              <div className="p-2 bg-[#333333] rounded text-center">
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs mb-1">Variant B</Badge>
                <p className="text-white text-xs font-medium">{suggestions.timing_test.variant_b}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setSuggestions(null)}
            size="sm"
            variant="outline"
            className="w-full border-[#444444] text-gray-300 hover:bg-[#333333]"
          >
            Clear Suggestions
          </Button>
        </div>
      )}

      {!suggestions && campaigns.length === 0 && (
        <p className="text-gray-400 text-xs">
          Launch campaigns to collect performance data for AI-powered A/B testing suggestions
        </p>
      )}
    </div>
  );
}