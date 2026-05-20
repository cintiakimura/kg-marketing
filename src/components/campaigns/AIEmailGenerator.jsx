import { invokeLLM } from '@/api/integrations';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2, CheckCircle2 } from 'lucide-react';

export default function AIEmailGenerator({ 
  currentContent = '', 
  currentSubject = '',
  targetAudience = '',
  language = 'English',
  campaigns = [],
  onApplyBody,
  onApplySubject
}) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailOptions, setEmailOptions] = useState([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState([]);

  const generateEmailBodies = async () => {
    if (!description.trim()) {
      alert('Please enter a description or topic');
      return;
    }

    setIsGenerating(true);
    try {
      // Analyze historical campaign performance
      const historicalData = campaigns.slice(0, 5).map(c => ({
        subject: c.email_subject,
        audience: c.target_audience,
        open_rate: c.open_rate,
        click_rate: c.click_rate
      }));

      const prompt = `Generate 3 different email body variations for KG PROTECH's IoT automotive training product.

Description/Topic: ${description}
Target Audience: ${targetAudience || 'automotive professionals'}
Language: ${language}
Product: Automatic Fault Simulator for vehicles via internet, enabling remote diagnostic training with 60% cost savings and reduced setup time.

Historical Performance Context:
${historicalData.length > 0 ? JSON.stringify(historicalData, null, 2) : 'No historical data'}

Requirements:
1. Generate 3 DIFFERENT variations (short, medium, detailed)
2. Each should be concise and professional
3. Focus on benefits: 60% cost savings and reduced setup time
4. Ask for a 15-minute webinar
5. Include this EXACT call-to-action in each variation:
"📅 Schedule your 15-minute webinar: https://calendar.google.com/calendar/appointments/schedules/AcZssZ0H5P8VL5P_7YDKGZmLJZBQGgKpB5mTl8jC8yz8dXQr0YJZQ0?gv=true"
6. End with this signature:
Best regards,
Cintia Kimura
Founder and COO
cintia@kgprotech.com
Tel: +33 07 68 62 07 04

Return JSON:
{
  "variations": [
    {"label": "Short & Direct", "body": "..."},
    {"label": "Balanced", "body": "..."},
    {"label": "Detailed", "body": "..."}
  ]
}`;

      const result = await invokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  body: { type: "string" }
                }
              }
            }
          }
        }
      });

      setEmailOptions(result.variations || []);
    } catch (error) {
      alert('Failed to generate email variations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSubjectLines = async () => {
    const emailBody = currentContent || description;
    if (!emailBody.trim()) {
      alert('Please enter email content first');
      return;
    }

    setIsGenerating(true);
    try {
      // Get A/B test learnings from historical campaigns
      const abTestData = campaigns
        .filter(c => c.ab_test_variant && c.email_subject && c.open_rate > 0)
        .map(c => ({
          subject: c.email_subject,
          variant: c.ab_test_variant,
          open_rate: c.open_rate,
          audience: c.target_audience
        }));

      const prompt = `Generate 5 compelling subject line variations based on email content and A/B test learnings.

Email Content: ${emailBody.substring(0, 500)}...
Target Audience: ${targetAudience || 'automotive professionals'}
Language: ${language}

A/B Test Learnings:
${abTestData.length > 0 ? JSON.stringify(abTestData, null, 2) : 'No historical A/B test data'}

Requirements:
1. Generate 5 different subject lines
2. Each should be compelling, clear, and drive opens
3. Apply learnings from A/B tests (what worked, what didn't)
4. Keep under 60 characters
5. Professional tone
6. Focus on value proposition

Return JSON:
{
  "suggestions": [
    {"text": "...", "reason": "why this works based on data/best practices"},
    ...
  ]
}`;

      const result = await invokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSubjectSuggestions(result.suggestions || []);
    } catch (error) {
      alert('Failed to generate subject lines. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-kg-raised rounded-lg border border-green-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-green-400" />
          <Label className="text-white font-semibold">AI Email Assistant</Label>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-gray-400 text-xs mb-1">Describe your email topic or goal</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., 'Introduce new IoT training solution to fleet managers' or 'Follow up after initial contact about cost savings'"
              rows={2}
              className="bg-kg-card border-green-500/20 text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateEmailBodies}
              disabled={isGenerating}
              variant="kg"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Email Variations'}
            </Button>
            <Button
              onClick={generateSubjectLines}
              disabled={isGenerating}
              className="bg-kg-raised hover:bg-[#444444] text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Suggest Subject Lines'}
            </Button>
          </div>
        </div>
      </div>

      {emailOptions.length > 0 && (
        <div className="space-y-3">
          <Label className="text-gray-300">Select Email Body Variation</Label>
          {emailOptions.map((option, index) => (
            <div key={index} className="p-4 bg-kg-card rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium text-sm">{option.label}</span>
                <Button
                  size="sm"
                  onClick={() => onApplyBody(option.body)}
                  className="bg-kg-btn hover:bg-kg-btn-hover text-white h-7 text-xs"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Use This
                </Button>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{option.body}</p>
            </div>
          ))}
        </div>
      )}

      {subjectSuggestions.length > 0 && (
        <div className="space-y-3">
          <Label className="text-gray-300">Suggested Subject Lines</Label>
          {subjectSuggestions.map((suggestion, index) => (
            <div key={index} className="p-3 bg-kg-card rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">{suggestion.text}</span>
                <Button
                  size="sm"
                  onClick={() => onApplySubject(suggestion.text)}
                  className="bg-kg-btn hover:bg-kg-btn-hover text-white h-6 text-xs"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Use
                </Button>
              </div>
              <p className="text-gray-400 text-xs">{suggestion.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}