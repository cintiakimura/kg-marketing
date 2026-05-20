/**
 * AI routes — Grok integration (Smart Lead Finder + email generation).
 * Uses GROK_API_KEY_LUMEN from environment.
 */
import { Router } from 'express';

const router = Router();

const GROK_URL = () => process.env.GROK_API_URL || 'https://api.x.ai/v1';
const GROK_MODEL = () => process.env.GROK_MODEL || 'grok-2-latest';

const RESEARCH_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the web for companies, LinkedIn profiles, news, press releases, and professional activity.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'x_keyword_search',
      description:
        'Search X (Twitter) for posts, threads, and mentions about a person, role, or company.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keywords, handles, or hashtags' },
          focus: {
            type: 'string',
            enum: ['posts', 'people', 'companies'],
          },
        },
        required: ['query'],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are an elite B2B lead researcher for KG Marketing (precision IoT, automotive, and industrial training campaigns).

RULES:
- QUALITY over quantity: only real decision-makers with evidence (posts, talks, hiring, initiatives).
- Use web_search and x_keyword_search before claiming activity.
- fit_score 1-10: only include leads scoring 7+ unless fewer exist; prefer 8-15 total leads max.
- recent_activity: 2-4 bullet points as a single string separated by "\\n• " or newline bullets.
- suggested_first_message: short, natural, personalized (no generic spam).
- confidence_level: "high" | "medium" | "low" based on source quality.
- Use plausible work emails when not found; mark low confidence if email is inferred.
- Return valid JSON only when asked.`;

async function callGrok(messages, { jsonMode = true, tools = true } = {}) {
  const apiKey = process.env.GROK_API_KEY_LUMEN;
  if (!apiKey) {
    const err = new Error('GROK_API_KEY_LUMEN is not set');
    err.status = 503;
    throw err;
  }

  const body = {
    model: GROK_MODEL(),
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.35,
    max_tokens: 8192,
  };

  if (jsonMode) body.response_format = { type: 'json_object' };
  if (tools) {
    body.tools = RESEARCH_TOOLS;
    body.tool_choice = 'auto';
  }

  const res = await fetch(`${GROK_URL()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Grok error ${res.status}: ${text.slice(0, 400)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

function buildIcpSummary(icp) {
  return [
    `Industry / sector: ${icp.industry}`,
    `Company size: ${icp.companySize}`,
    `Target roles: ${(icp.targetRoles || []).join(', ')}`,
    `Geography: ${icp.geography}`,
    `Pain points / keywords: ${icp.painPoints || 'not specified'}`,
    icp.focusCompanies
      ? `Priority companies / competitors: ${icp.focusCompanies}`
      : 'Discover best-fit organizations (no fixed list).',
  ].join('\n');
}

function normalizeLead(raw, index) {
  const fullName = (raw.full_name || raw.name || '').trim() || `Contact ${index + 1}`;
  const fitScore = Math.min(10, Math.max(1, Number(raw.fit_score ?? raw.fitScore) || 5));
  let recentActivity = raw.recent_activity ?? raw.recentActivity ?? '';
  if (Array.isArray(recentActivity)) {
    recentActivity = recentActivity.map((b) => `• ${String(b).replace(/^•\s*/, '')}`).join('\n');
  }

  const slug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '.');
  const companySlug = (raw.company || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '');

  return {
    id: `sl_${slug}_${Date.now()}_${index}`,
    name: fullName,
    full_name: fullName,
    title: (raw.title || '').trim() || 'Decision-maker',
    company: (raw.company || '').trim() || 'Unknown company',
    linkedin_url: (raw.linkedin_url || raw.linkedinUrl || '').trim(),
    linkedinUrl: (raw.linkedin_url || raw.linkedinUrl || '').trim(),
    location: (raw.location || '').trim(),
    email:
      (raw.email || '').trim() ||
      `${slug.split('.')[0] || 'contact'}@${companySlug}.pending`,
    fitScore,
    fit_score: fitScore,
    fitReasoning: (raw.fit_reasoning || raw.fitReasoning || '').trim(),
    fit_reasoning: (raw.fit_reasoning || raw.fitReasoning || '').trim(),
    recentActivity: String(recentActivity).trim(),
    recent_activity: String(recentActivity).trim(),
    suggestedFirstMessage: (
      raw.suggested_first_message ||
      raw.suggestedFirstMessage ||
      ''
    ).trim(),
    suggested_first_message: (
      raw.suggested_first_message ||
      raw.suggestedFirstMessage ||
      ''
    ).trim(),
    confidence_level: raw.confidence_level || (fitScore >= 8 ? 'high' : fitScore >= 6 ? 'medium' : 'low'),
  };
}

function buildDemoLeads(icp) {
  const industry = icp.industry || 'automotive technology';
  const geo = icp.geography || 'Europe';
  const roles = icp.targetRoles?.length ? icp.targetRoles : ['Head of Product', 'L&D Manager'];

  const raw = [
    {
      full_name: 'Elena Vasquez',
      title: roles[0],
      company: 'NordDrive Systems',
      linkedin_url: 'https://www.linkedin.com/in/example',
      location: `Munich, ${geo}`,
      email: 'e.vasquez@norddrive.example',
      fit_score: 9,
      fit_reasoning: `Owns product and training alignment in ${industry}. Posted about technician certification rollout — strong intent for structured L&D programs.`,
      recent_activity:
        '• Posted last week on implementing EV diagnostics training\n• Commented on reducing senior engineer shadowing time\n• Company announced new plant competency framework',
      suggested_first_message: `Hi Elena — saw your training initiative in ${industry}. We help teams shorten ramp-up without pulling seniors off projects. Open to a 15-min call?`,
      confidence_level: 'high',
    },
    {
      full_name: 'Marcus Chen',
      title: roles[1] || 'Training Manager',
      company: 'Apex Mobility Components',
      linkedin_url: 'https://www.linkedin.com/in/example-mchen',
      location: 'Detroit, USA',
      email: 'marcus.chen@apexmobility.example',
      fit_score: 8,
      fit_reasoning:
        'Active on X discussing L&D tooling gaps; Apex expanded lines — typical moment for standardized training.',
      recent_activity:
        '• Thread on onboarding time for new plant hires\n• Liked posts about simulation-based modules\n• Spoke at supplier quality workshop',
      suggested_first_message:
        "Marcus — your thread on onboarding at Apex caught my eye. We've helped similar plants cut time-to-competency. Worth a quick compare?",
      confidence_level: 'high',
    },
    {
      full_name: 'Dr. Amira Okonkwo',
      title: 'Chief Learning Officer',
      company: 'Helix Automotive Tech',
      linkedin_url: 'https://www.linkedin.com/in/example-aokonkwo',
      location: 'London, UK',
      email: 'a.okonkwo@helixauto.example',
      fit_score: 9,
      fit_reasoning: `Coordinates global L&D; Helix matches geography (${geo}) and pain theme "${icp.painPoints || 'digital training'}".`,
      recent_activity:
        '• Conference talk on multi-site competency frameworks\n• LinkedIn poll on training ROI metrics\n• Hiring 2 instructional designers',
      suggested_first_message:
        'Amira — congrats on the competency framework talk. Curious if you’re evaluating packaged campaigns for multi-site rollouts?',
      confidence_level: 'medium',
    },
    {
      full_name: 'James Whitfield',
      title: 'CTO',
      company: 'TorqueLine Industries',
      linkedin_url: 'https://www.linkedin.com/in/example-jwhitfield',
      location: 'Chicago, USA',
      email: 'j.whitfield@torqueline.example',
      fit_score: 7,
      fit_reasoning:
        'Sponsors smart-factory skilling; technical champion path to L&D budget.',
      recent_activity:
        '• Quoted on upskilling for predictive maintenance\n• Retweeted digital twin training pilot',
      suggested_first_message:
        'James — your comments on predictive maintenance upskilling resonated. We bridge engineering concepts to shop-floor modules.',
      confidence_level: 'medium',
    },
    {
      full_name: 'Sofia Lindström',
      title: 'Head of People Development',
      company: 'Volta Components AB',
      linkedin_url: 'https://www.linkedin.com/in/example-slindstrom',
      location: 'Stockholm, Sweden',
      email: 's.lindstrom@volta.example',
      fit_score: 8,
      fit_reasoning: 'HR/L&D hybrid role; Volta published sustainability + workforce reskilling report.',
      recent_activity:
        '• Shared reskilling report executive summary\n• Commented on VR training pilots',
      suggested_first_message:
        'Sofia — your reskilling report mentions technician pathways. Happy to share how peers packaged similar rollouts.',
      confidence_level: 'high',
    },
  ];

  return raw.map(normalizeLead);
}

async function researchLeadsWithGrok(icp) {
  const icpSummary = buildIcpSummary(icp);

  const phase1Content = await callGrok([
    {
      role: 'user',
      content: `PHASE 1 — Use web_search. Find 10-15 companies that match this ICP:\n${icpSummary}\nReturn JSON: { "companies": [{ "name", "why_fit", "size", "hq" }] }`,
    },
  ]);

  const phase1 = parseJson(phase1Content);
  const companies = phase1?.companies || [];

  const phase2Content = await callGrok([
    {
      role: 'user',
      content: `PHASE 2 — Use web_search and x_keyword_search. For these companies find 12-20 REAL decision-makers in target roles with evidence.\nCompanies: ${JSON.stringify(companies.slice(0, 12))}\nICP:\n${icpSummary}\nReturn JSON: { "candidates": [{ "full_name", "title", "company", "linkedin_url", "location" }] }`,
    },
  ]);

  const phase2 = parseJson(phase2Content);
  const candidates = phase2?.candidates || [];

  const phase3Content = await callGrok([
    {
      role: 'user',
      content: `PHASE 3 — Analyze recent activity (LinkedIn-style posts, X, news) for each candidate. Score fit 1-10 with 2-3 sentence fit_reasoning. Only keep 7+.\nReturn 8-15 leads as JSON:\n{ "leads": [{ "full_name", "title", "company", "linkedin_url", "location", "email", "fit_score", "fit_reasoning", "recent_activity", "suggested_first_message", "confidence_level" }] }\nCandidates: ${JSON.stringify(candidates.slice(0, 18))}\nPain points: ${icp.painPoints || 'general'}`,
    },
  ]);

  const phase3 = parseJson(phase3Content);
  const list = phase3?.leads || [];

  return list
    .map(normalizeLead)
    .filter((l) => l.name && l.company && l.fitScore >= 6)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 15);
}

/**
 * POST /api/ai/find-leads
 * Body: { industry, companySize, targetRoles[], geography, painPoints, focusCompanies? }
 */
router.post('/find-leads', async (req, res, next) => {
  try {
    const icp = req.body;
    if (!icp.industry?.trim() || !icp.geography?.trim() || !icp.targetRoles?.length) {
      return res.status(400).json({
        success: false,
        error: 'industry, geography, and targetRoles are required',
      });
    }

    let leads = [];
    let meta = { source: 'demo' };

    if (process.env.GROK_API_KEY_LUMEN) {
      console.log('[ai/find-leads] Grok multi-phase research', icp.industry);
      leads = await researchLeadsWithGrok(icp);
      if (leads.length === 0) {
        leads = buildDemoLeads(icp);
        meta = { source: 'demo', message: 'Grok returned no leads; showing demo set' };
      } else {
        meta = {
          source: 'grok',
          companiesResearched: leads.length,
          candidatesReviewed: leads.length,
        };
      }
    } else {
      leads = buildDemoLeads(icp);
      meta.message = 'Set GROK_API_KEY_LUMEN for live Grok research';
    }

    res.json({ success: true, data: { leads, meta } });
  } catch (err) {
    console.error('[ai/find-leads]', err.message);
    next(err);
  }
});

/**
 * POST /api/ai/generate-email
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
      const content = await callGrok(
        [
          {
            role: 'user',
            content: `Write a short B2B email. Tone: ${tone}. JSON only: { "subject", "body", "bodyHtml" }\nLead: ${JSON.stringify(lead)}\nCampaign: ${JSON.stringify(campaign)}`,
          },
        ],
        { tools: false }
      );
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
