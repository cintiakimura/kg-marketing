import { Webinar, Lead } from '@/api/entities';
import { invokeLLM, sendEmail } from '@/api/integrations';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIScheduler({ lead, onScheduled }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const webinars = await Webinar.list();
      const leads = await Lead.list();
      
      const prompt = `You are an AI scheduling assistant for KG PROTECH analyzing availability patterns.

Lead Information:
- Name: ${lead.full_name}
- Company: ${lead.company || 'Not specified'}
- Language: ${lead.language_preference || 'English'}
- Status: ${lead.status}
- Timezone estimate: Based on company location

Historical Webinar Data:
${JSON.stringify(webinars.slice(0, 10).map(w => ({
  title: w.title,
  start_time: w.start_time,
  attendees_count: w.attendees?.length || 0
})), null, 2)}

Current Date: ${new Date().toISOString()}

TASK: Suggest 3 optimal meeting times for a 15-minute webinar with this lead.

Consider:
1. Time zone compatibility (European business hours for KG PROTECH)
2. Best days: Tuesday-Thursday typically have higher attendance
3. Best times: 10:00 AM - 4:00 PM local time
4. Avoid Mondays (busy) and Fridays (low engagement)
5. Language preference may indicate timezone
6. Recent successful webinar times

Return JSON with 3 time slot suggestions:
{
  "suggestions": [
    {
      "datetime": "ISO 8601 datetime string",
      "day_name": "Tuesday",
      "time_display": "10:00 AM CET",
      "reason": "why this time is optimal",
      "confidence": "high/medium/low",
      "timezone": "CET or estimated timezone"
    }
  ],
  "analysis": "brief explanation of scheduling strategy"
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
                  datetime: { type: "string" },
                  day_name: { type: "string" },
                  time_display: { type: "string" },
                  reason: { type: "string" },
                  confidence: { type: "string" },
                  timezone: { type: "string" }
                }
              }
            },
            analysis: { type: "string" }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      alert('Failed to analyze optimal times. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSchedule = async (suggestion) => {
    setIsScheduling(true);
    try {
      const webinar = await Webinar.create({
        title: `Follow-up Meeting with ${lead.full_name}`,
        description: `Scheduled follow-up meeting with ${lead.full_name} from ${lead.company || 'company'}`,
        start_time: suggestion.datetime,
        end_time: new Date(new Date(suggestion.datetime).getTime() + 15 * 60000).toISOString(),
        host_name: 'Cintia Kimura',
        meeting_link: 'https://meet.google.com/xyz',
        attendees: [{
          name: lead.full_name,
          email: lead.email,
          registered_at: new Date().toISOString()
        }]
      });

      await Lead.update(lead.id, {
        status: 'scheduled',
        next_followup_date: suggestion.datetime,
        notes: (lead.notes || '') + `\n[${new Date().toISOString()}] AI-scheduled meeting for ${suggestion.time_display}`
      });

      // Send confirmation email
      await sendEmail({
        from_name: 'KG PROTECH',
        to: lead.email,
        subject: `Meeting Scheduled: ${suggestion.day_name} at ${suggestion.time_display}`,
        body: `Dear ${lead.full_name},<br><br>
Your 15-minute webinar with KG PROTECH has been scheduled for:<br><br>
<strong>${suggestion.day_name}, ${suggestion.time_display}</strong><br><br>
Meeting Link: <a href="https://meet.google.com/xyz" style="color: #22A855;">Join Meeting</a><br><br>
We look forward to discussing how our IoT Automatic Fault Simulator can benefit ${lead.company || 'your organization'}.<br><br>
Best regards,<br>
Cintia Kimura<br>
Founder and COO<br>
KG PROTECH`
      });

      if (onScheduled) {
        onScheduled(webinar);
      }

      setSuggestions(null);
      alert('Meeting scheduled successfully! Confirmation email sent.');
    } catch (error) {
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const confidenceColors = {
    high: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="p-4 bg-kg-input rounded-lg border border-green-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-400" />
          <span className="text-white font-medium text-[18px]">AI Meeting Scheduler</span>
        </div>
        {!suggestions && (
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="sm"
            variant="kgAi"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Find Optimal Times
              </>
            )}
          </Button>
        )}
      </div>

      {suggestions && (
        <div className="space-y-3">
          <div className="p-2 bg-kg-card rounded">
            <p className="text-gray-300 text-[18px]">{suggestions.analysis}</p>
          </div>

          {suggestions.suggestions.map((suggestion, idx) => (
            <div key={idx} className="p-3 bg-kg-card rounded border border-green-500/30">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-[18px]">{suggestion.day_name}</span>
                    <Badge className={`${confidenceColors[suggestion.confidence]} border-0 text-[18px]`}>
                      {suggestion.confidence}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-green-400 text-[18px] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{suggestion.time_display}</span>
                  </div>
                  <p className="text-gray-400 text-[18px]">{suggestion.reason}</p>
                </div>
                <Button
                  onClick={() => handleSchedule(suggestion)}
                  disabled={isScheduling}
                  size="sm"
                  variant="kgAi"
                >
                  {isScheduling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          <Button
            onClick={() => setSuggestions(null)}
            size="sm"
            variant="outline"
            className="w-full border-green-500/20 text-gray-300 hover:bg-kg-input"
          >
            Clear Suggestions
          </Button>
        </div>
      )}

      {!suggestions && !isAnalyzing && (
        <p className="text-gray-400 text-[18px]">
          AI analyzes historical patterns, timezones, and engagement data to suggest optimal meeting times
        </p>
      )}
    </div>
  );
}