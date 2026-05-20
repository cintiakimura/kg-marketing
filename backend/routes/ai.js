/**
 * AI routes — Grok integration (Smart Lead Finder + email generation).
 * Uses GROK_API_KEY_LUMEN from environment.
 */
import { Router } from 'express';

const router = Router();

const GROK_URL = () => process.env.GROK_API_URL || 'https://api.x.ai/v1';
const GROK_MODEL = () => process.env.GROK_MODEL || 'grok-2-latest';

async function callGrok(messages, { jsonMode = true } = {}) {
  const apiKey = process.env.GROK_API_KEY_LUMEN;
  if (!apiKey) {
    const err = new Error('GROK_API_KEY_LUMEN is not set');
    err.status = 503;
    throw err;
  }

  const res = await fetch(`${GROK_URL()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROK_MODEL(),
      messages,
      temperature: 0.35,
      max_tokens: 4096,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      tools: [
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for companies and professionals',
            parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
          },
        },
        {
          type: 'function',
          function: {
            name: 'x_keyword_search',
            description: 'Search X for keyword activity',
            parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
          },
        },
      ],
      tool_choice: 'auto',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Grok error ${res.status}: ${text.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text?.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

/** Demo leads when Grok is unavailable */
function demoLeads(icp) {
  return [
    {
      name: 'Elena Vasquez',
      title: icp.targetRoles?.[0] || 'Head of Product Development',
      company: 'NordDrive Systems',
      linkedinUrl: 'https://www.linkedin.com/in/example',
      location: icp.geography || 'Europe',
      email: 'e.vasquez@example.com',
      fitScore: 9,
      fitReasoning: 'Posted about rolling out technician training last week — high intent for structured programs.',
      recentActivity: 'LinkedIn post on EV diagnostics training rollout.',
      suggestedFirstMessage: `Hi Elena — saw your training initiative in ${icp.industry}. We help teams like yours shorten ramp-up without pulling seniors off projects. Open to a quick call?`,
    },
  ];
}

/**
 * POST /api/ai/find-leads
 * Body: { industry, companySize, targetRoles[], geography, painPoints, focusCompanies? }
 */
router.post('/find-leads', async (req, res, next) => {
  try {
    const icp = req.body;
    if (!icp.industry || !icp.geography || !icp.targetRoles?.length) {
      return res.status(400).json({
        success: false,
        error: 'industry, geography, and targetRoles are required',
      });
    }

    let leads = [];
    let meta = { source: 'demo' };

    if (process.env.GROK_API_KEY_LUMEN) {
      const content = await callGrok([
        {
          role: 'system',
          content:
            'You are a B2B lead researcher. Use web_search and x_keyword_search. Return 4-6 high-quality decision-makers with fitScore 7+. JSON only.',
        },
        {
          role: 'user',
          content: `Find leads for ICP:\n${JSON.stringify(icp, null, 2)}\nReturn: { "leads": [{ "name","title","company","linkedinUrl","location","email","fitScore","fitReasoning","recentActivity","suggestedFirstMessage" }] }`,
        },
      ]);
      const parsed = parseJson(content);
      leads = parsed?.leads || [];
      meta = { source: 'grok' };
    } else {
      leads = demoLeads(icp);
      meta.message = 'Set GROK_API_KEY_LUMEN for live Grok research';
    }

    res.json({ success: true, data: { leads, meta } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/generate-email
 * Body: { lead, campaign?, tone? }
 */
router.post('/generate-email', async (req, res, next) => {
  try {
    const { lead, campaign = {}, tone = 'professional' } = req.body;
    if (!lead?.full_name && !lead?.name) {
      return res.status(400).json({ success: false, error: 'lead name is required' });
    }

    let email = {
      subject: `Quick idea for ${lead.company || 'your team'}`,
      body: `Hi ${lead.full_name || lead.name},\n\nI noticed your work at ${lead.company || 'your company'} and thought our training programs might help.\n\nWould you be open to a brief call?\n\nBest,\nKG Protech`,
      bodyHtml: '',
    };

    if (process.env.GROK_API_KEY_LUMEN) {
      const content = await callGrok([
        {
          role: 'system',
          content: `Write a short B2B email. Tone: ${tone}. JSON only: { "subject", "body", "bodyHtml" }`,
        },
        {
          role: 'user',
          content: `Lead: ${JSON.stringify(lead)}\nCampaign: ${JSON.stringify(campaign)}`,
        },
      ]);
      const parsed = parseJson(content);
      if (parsed?.subject && parsed?.body) {
        email = {
          subject: parsed.subject,
          body: parsed.body,
          bodyHtml: parsed.bodyHtml || parsed.body.replace(/\n/g, '<br>'),
        };
      }
    }

    res.json({ success: true, data: email });
  } catch (err) {
    next(err);
  }
});

export default router;
