/**
 * AI routes — Grok integration (Smart Lead Finder + email generation).
 * Uses GROK_API_KEY_LUMEN from environment.
 */
import { Router } from 'express';

const router = Router();

const GROK_URL = () => process.env.GROK_API_URL || 'https://api.x.ai/v1';
const GROK_MODEL = () => process.env.GROK_MODEL || 'grok-2-latest';

const MAX_LEADS = 12;
const MIN_FIT_SCORE = 7;

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

const SYSTEM_PROMPT = `You are an extremely rigorous and honest B2B lead researcher for KG Marketing (precision IoT, automotive, and industrial training campaigns).

You refuse to hallucinate names, profiles, LinkedIn URLs, posts, or activity. If evidence is weak or not found, return fewer results — never fill gaps with invented data. Accuracy and truthfulness are more important than volume.

ANTI-HALLUCINATION & PRECISION RULES:
- Only return people who actually exist based on real search results from web_search and x_keyword_search in this session.
- Always try to find real linkedin.com/in/ URLs from search. Never use placeholder or example URLs.
- Do NOT invent work emails. Omit the email field if not found in public sources.
- For every lead you must verify:
  1) The person currently or recently holds the target role
  2) The company matches the ICP
  3) There is recent public activity (last 3–6 months) related to the pain points
- If you cannot find solid evidence for any of the above → EXCLUDE that lead entirely.
- Maximum ${MAX_LEADS} leads. Prioritize quality over quantity (target 8–12).
- fit_score 1–10: only include leads scoring ${MIN_FIT_SCORE}+ with evidence-backed reasoning.
- fit_reasoning: 2–3 strong sentences citing real signals (role, company fit, activity).
- recent_activity: 2–4 bullet points as a string (use "\\n• " between bullets).
- suggested_first_message: natural, personalized, grounded in cited activity (no generic spam).
- verification_notes: REQUIRED — explain which sources you used (e.g. "web_search: LinkedIn profile + company press release Nov 2025; x_keyword_search: post about technician training").
- confidence_level: "high" (LinkedIn + 2+ activity signals) | "medium" (one strong signal) | "low" (insufficient — do not include lead).
- Return valid JSON only when asked.`;

const WEBINAR_CTA =
  '📅 Schedule your 15-minute webinar: https://calendar.google.com/calendar/appointments/schedules/AcZssZ0H5P8VL5P_7YDKGZmLJZBQGgKpB5mTl8jC8yz8dXQr0YJZQ0?gv=true';

const KG_SIGNATURE = `Best regards,
Cintia Kimura
Founder and COO
cintia@kgprotech.com
Tel: +33 07 68 62 07 04`;

const CAMPAIGN_SYSTEM_PROMPT = `You are a senior B2B marketing strategist and copywriter for KG ProTech (industrial IoT, automotive diagnostic training, remote learning).

PRODUCT FACTS YOU MAY USE (do not invent others):
- Automatic Fault Simulator for vehicles over the internet
- Enables remote diagnostic training for technicians and engineers
- ~60% cost savings vs traditional setups
- Reduced setup time for training labs
- Buyers: automotive OEMs, fleets, training centers, engineering teams

ANTI-HALLUCINATION & QUALITY RULES (same rigor as lead research):
- Do NOT invent customer names, logos, case studies, awards, or statistics beyond the facts above.
- Do NOT fabricate URLs except the webinar CTA link provided in the user message.
- Do NOT claim partnerships or certifications unless the user brief explicitly states them.
- Write concise, professional, persuasive industrial/tech B2B copy — no hype spam.
- Email body: 2–3 short paragraphs max, direct opening, webinar CTA (not a hard sales pitch).
- Always end email_body with the exact signature block provided in the user message.
- Return valid JSON only when asked. No markdown fences.`;

async function callGrok(messages, { jsonMode = true, tools = true, temperature = 0.25, systemPrompt = SYSTEM_PROMPT } = {}) {
  const apiKey = process.env.GROK_API_KEY_LUMEN;
  if (!apiKey) {
    const err = new Error('GROK_API_KEY_LUMEN is not set');
    err.status = 503;
    throw err;
  }

  const body = {
    model: GROK_MODEL(),
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature,
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

function buildStructuredIcp(icp) {
  return [
    `Industry / sector: ${icp.industry || 'not specified'}`,
    `Company size: ${icp.companySize || 'not specified'}`,
    `Target roles: ${(icp.targetRoles || []).join(', ') || 'not specified'}`,
    `Geography: ${icp.geography || 'not specified'}`,
    `Pain points / keywords: ${icp.painPoints || 'not specified'}`,
    icp.focusCompanies
      ? `Priority companies / competitors: ${icp.focusCompanies}`
      : 'Discover best-fit organizations (no fixed list).',
  ].join('\n');
}

function buildIcpSummary(icp) {
  const customPrompt = (icp.customPrompt || '').trim();
  const structured = buildStructuredIcp(icp);

  if (customPrompt) {
    return [
      '=== PRIMARY RESEARCH DIRECTIVE (HIGHEST PRIORITY) ===',
      'The user wrote a full custom prompt below. Treat it as the main definition of who to find,',
      'which roles, industries, geographies, signals, and filters matter. Follow it closely.',
      '',
      customPrompt,
      '',
      'While honoring the directive, still obey anti-hallucination rules: only real people with evidence.',
      'Return fewer leads rather than inventing profiles.',
      '',
      '=== Supporting structured ICP (secondary — fill gaps only) ===',
      structured,
    ].join('\n');
  }

  return structured;
}

function hasCustomPrompt(icp) {
  return Boolean((icp.customPrompt || '').trim());
}

function isFabricatedLinkedIn(url) {
  if (!url) return true;
  const u = url.toLowerCase();
  if (!u.includes('linkedin.com/in/')) return true;
  return /example|placeholder|fake|sample|\/in\/in$/.test(u);
}

function passesQualityGate(raw) {
  const fitScore = Number(raw.fit_score ?? raw.fitScore) || 0;
  const confidence = (raw.confidence_level || '').toLowerCase();
  const verification = (raw.verification_notes || raw.verificationNotes || '').trim();
  const linkedin = (raw.linkedin_url || raw.linkedinUrl || '').trim();

  if (fitScore < MIN_FIT_SCORE) return false;
  if (confidence === 'low') return false;
  if (!verification || verification.length < 20) return false;
  if (!raw.full_name && !raw.name) return false;
  if (!(raw.company || '').trim()) return false;
  if (/^DEMO/i.test(verification)) return true;

  if (!linkedin || isFabricatedLinkedIn(linkedin)) {
    return confidence === 'medium' && verification.length >= 40;
  }
  return confidence === 'high' || confidence === 'medium';
}

function normalizeLead(raw, index, { demo = false } = {}) {
  const fullName = (raw.full_name || raw.name || '').trim() || `Contact ${index + 1}`;
  const fitScore = Math.min(10, Math.max(1, Number(raw.fit_score ?? raw.fitScore) || 5));
  let recentActivity = raw.recent_activity ?? raw.recentActivity ?? '';
  if (Array.isArray(recentActivity)) {
    recentActivity = recentActivity.map((b) => `• ${String(b).replace(/^•\s*/, '')}`).join('\n');
  }

  const linkedin = (raw.linkedin_url || raw.linkedinUrl || '').trim();
  const verificationNotes =
    (raw.verification_notes || raw.verificationNotes || '').trim() ||
    (demo ? 'DEMO DATA — illustrative lead for UI testing; not from live Grok search.' : '');

  let confidence = (raw.confidence_level || '').toLowerCase();
  if (!['high', 'medium', 'low'].includes(confidence)) {
    confidence = fitScore >= 8 && linkedin && !isFabricatedLinkedIn(linkedin) ? 'high' : 'medium';
  }

  return {
    id: `sl_${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}_${index}`,
    name: fullName,
    full_name: fullName,
    title: (raw.title || '').trim() || 'Decision-maker',
    company: (raw.company || '').trim() || 'Unknown company',
    linkedin_url: linkedin,
    linkedinUrl: linkedin,
    location: (raw.location || '').trim(),
    email: (raw.email || '').trim() || '',
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
    verification_notes: verificationNotes,
    verificationNotes,
    confidence_level: confidence,
  };
}

function buildDemoLeads(icp) {
  const industry = icp.industry || 'automotive technology';
  const geo = icp.geography || 'Europe';
  const roles = icp.targetRoles?.length
    ? icp.targetRoles
    : ['Training Manager', 'Aftersales Training Manager', 'Technical Training Manager'];
  const pain = icp.painPoints || 'technician training and onboarding';

  const raw = [
    {
      full_name: 'Elena Vasquez',
      title: roles[0],
      company: 'NordDrive Systems',
      linkedin_url: '',
      location: `Munich, ${geo}`,
      fit_score: 9,
      fit_reasoning: `Owns product and training alignment in ${industry}. Public signals point to rolling out technician certification — strong fit for structured L&D tied to ${pain}.`,
      recent_activity:
        '• Discussed EV diagnostics training rollout (industry press, Q1)\n• Company competency framework initiative announced\n• Hiring training coordinators for new plant line',
      suggested_first_message: `Hi Elena — noticed NordDrive’s push on technician certification in ${industry}. We help teams shorten ramp-up without pulling seniors off critical projects. Open to a 15-min call?`,
      verification_notes:
        'DEMO: Illustrative profile for offline UI — enable GROK_API_KEY_LUMEN for live web_search + x_keyword_search verification.',
      confidence_level: 'medium',
    },
    {
      full_name: 'Marcus Chen',
      title: roles[1] || 'Training Manager',
      company: 'Apex Mobility Components',
      linkedin_url: '',
      location: 'Detroit, USA',
      fit_score: 8,
      fit_reasoning:
        'Training Manager at Apex during manufacturing expansion — typical inflection for standardized onboarding and L&D tooling.',
      recent_activity:
        '• Public thread themes: reducing onboarding time for plant hires\n• Supplier quality workshop participation\n• Interest in simulation-based training modules',
      suggested_first_message:
        "Marcus — Apex's expansion often triggers onboarding bottlenecks. We've helped similar plants cut time-to-competency — worth a quick compare?",
      verification_notes: 'DEMO: Replace with live Grok research for verified LinkedIn and X activity.',
      confidence_level: 'medium',
    },
    {
      full_name: 'Dr. Amira Okonkwo',
      title: 'Chief Learning Officer',
      company: 'Helix Automotive Tech',
      linkedin_url: '',
      location: 'London, UK',
      fit_score: 9,
      fit_reasoning: `Global L&D leader; Helix matches geography (${geo}) and pain theme "${pain}".`,
      recent_activity:
        '• Conference talk on multi-site competency frameworks\n• Workforce reskilling report published\n• Instructional designer hiring wave',
      suggested_first_message:
        'Amira — your competency framework work at Helix aligns with packaged multi-site training rollouts. Happy to share a 2-page peer benchmark?',
      verification_notes: 'DEMO: Live search would confirm role + recent CLO-level activity.',
      confidence_level: 'medium',
    },
  ];

  return raw.map((r, i) => normalizeLead(r, i, { demo: true }));
}

async function researchLeadsWithGrok(icp) {
  const icpSummary = buildIcpSummary(icp);
  const meta = {
    phases: [],
    customPromptApplied: hasCustomPrompt(icp),
  };

  const phase1Content = await callGrok([
    {
      role: 'user',
      content: `PHASE 1 — Use web_search extensively. Find 10–15 real companies matching this ICP. Only include companies you can evidence from search results.
ICP:
${icpSummary}

Return JSON: { "companies": [{ "name", "why_fit", "size", "hq", "evidence_source" }] }`,
    },
  ]);
  const phase1 = parseJson(phase1Content);
  const companies = phase1?.companies || [];
  meta.phases.push({ step: 'companies', count: companies.length });

  const phase2Content = await callGrok([
    {
      role: 'user',
      content: `PHASE 2 — Use web_search and x_keyword_search. For these companies find REAL decision-makers in the target roles. Do not invent names.
Companies: ${JSON.stringify(companies.slice(0, 12))}
ICP:
${icpSummary}

Return JSON: { "candidates": [{ "full_name", "title", "company", "linkedin_url", "location", "role_evidence" }] }
Exclude candidates without name + company + role evidence.`,
    },
  ]);
  const phase2 = parseJson(phase2Content);
  const candidates = (phase2?.candidates || []).filter((c) => c.full_name || c.name);
  meta.phases.push({ step: 'candidates', count: candidates.length });

  const phase3Content = await callGrok([
    {
      role: 'user',
      content: `PHASE 3 — For each candidate, search recent activity (web + X, last 3–6 months) related to: ${icp.painPoints || 'training and workforce development'}.
Score fit 1–10 with 2–3 sentence fit_reasoning. Only keep ${MIN_FIT_SCORE}+ with verified activity bullets.
Candidates: ${JSON.stringify(candidates.slice(0, 18))}

Return JSON:
{ "leads": [{ "full_name", "title", "company", "linkedin_url", "location", "fit_score", "fit_reasoning", "recent_activity", "suggested_first_message", "verification_notes", "confidence_level" }] }`,
    },
  ]);
  const phase3 = parseJson(phase3Content);
  let list = phase3?.leads || [];
  meta.phases.push({ step: 'scored', count: list.length });

  const phase4Content = await callGrok(
    [
      {
        role: 'user',
        content: `PHASE 4 — VERIFICATION PASS. Re-check each lead against anti-hallucination rules. Remove any lead lacking:
- verification_notes citing real sources
- Evidence of role + company + recent activity (3–6 months)
- confidence_level "high" or "medium" only
Maximum ${MAX_LEADS} leads.

Input leads: ${JSON.stringify(list)}

Return JSON: { "leads": [...], "discarded_count", "quality_summary" }`,
      },
    ],
    { temperature: 0.15 }
  );
  const phase4 = parseJson(phase4Content);
  if (phase4?.leads?.length) {
    list = phase4.leads;
    meta.discarded_count = phase4.discarded_count;
    meta.quality_summary = phase4.quality_summary;
  }
  meta.phases.push({ step: 'verified', count: list.length });

  return {
    leads: list
      .map(normalizeLead)
      .filter(passesQualityGate)
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, MAX_LEADS),
    meta,
  };
}

/**
 * POST /api/ai/find-leads
 */
router.post('/find-leads', async (req, res, next) => {
  try {
    const icp = req.body;
    const hasFullPrompt = hasCustomPrompt(icp);
    const hasStructured =
      icp.industry?.trim() &&
      icp.geography?.trim() &&
      icp.targetRoles?.length > 0;

    if (!hasFullPrompt && !hasStructured) {
      return res.status(400).json({
        success: false,
        error:
          'Provide structured fields (industry, geography, roles) or a full custom prompt',
      });
    }

    let leads = [];
    let meta = {
      source: 'demo',
      maxLeads: MAX_LEADS,
      customPromptApplied: hasCustomPrompt(icp),
    };

    if (process.env.GROK_API_KEY_LUMEN) {
      console.log('[ai/find-leads] Grok rigorous multi-phase research', icp.industry);
      const result = await researchLeadsWithGrok(icp);
      leads = result.leads;
      meta = {
        source: 'grok',
        maxLeads: MAX_LEADS,
        customPromptPrioritized: hasCustomPrompt(icp),
        ...result.meta,
        companiesResearched: result.meta.phases?.find((p) => p.step === 'companies')?.count ?? 0,
        candidatesReviewed: result.meta.phases?.find((p) => p.step === 'candidates')?.count ?? 0,
        leadsReturned: leads.length,
      };
      if (leads.length === 0) {
        leads = buildDemoLeads(icp);
        meta = {
          source: 'demo',
          message:
            'Grok found no leads passing verification gates; showing demo set. Refine ICP or try again.',
        };
      }
    } else {
      leads = buildDemoLeads(icp);
      meta.message = 'Set GROK_API_KEY_LUMEN for live Grok research with verification';
    }

    res.json({ success: true, data: { leads, meta } });
  } catch (err) {
    console.error('[ai/find-leads]', err.message);
    next(err);
  }
});

function normalizeCampaignGeneration(parsed, { language = 'English' } = {}) {
  const subjects = Array.isArray(parsed.email_subjects)
    ? parsed.email_subjects.filter(Boolean).slice(0, 3)
    : [];
  const primary =
    parsed.email_subject?.trim() ||
    subjects[0] ||
    'KG ProTech — Remote diagnostic training for your team';

  return {
    name: parsed.name?.trim() || 'New Campaign',
    target_audience: parsed.target_audience?.trim() || '',
    language: parsed.language || language,
    email_subjects: subjects.length ? subjects : [primary],
    email_subject: primary,
    email_body: parsed.email_body?.trim() || '',
    video_url_suggestions: Array.isArray(parsed.video_url_suggestions)
      ? parsed.video_url_suggestions.filter(Boolean)
      : [],
    key_messages: Array.isArray(parsed.key_messages)
      ? parsed.key_messages.filter(Boolean)
      : [],
    suggested_video_url: parsed.suggested_video_url?.trim() || null,
    rationale: parsed.rationale?.trim() || '',
    status: 'draft',
  };
}

function buildDemoCampaign(brief, language = 'English') {
  const name = brief.length > 60 ? `${brief.slice(0, 57)}…` : brief;
  return {
    name: name || 'KG ProTech Training Outreach',
    target_audience:
      'Automotive engineering leaders, L&D managers, and technical training directors at OEMs and tier-1 suppliers',
    language,
    email_subjects: [
      'Cut diagnostic training setup time — 15-min overview?',
      'Remote fault simulation for your technicians',
      '60% savings on automotive training labs',
    ],
    email_subject: 'Cut diagnostic training setup time — 15-min overview?',
    email_body: `Dear {{first_name}},

KG ProTech helps engineering and training teams run remote diagnostic exercises with our internet-based Automatic Fault Simulator — typically ~60% lower cost and faster lab setup than traditional approaches.

If you're scaling technician upskilling this quarter, I'd welcome 15 minutes to show how peers in automotive are using it.

${WEBINAR_CTA}

${KG_SIGNATURE}`,
    video_url_suggestions: [
      'Product walkthrough: remote fault injection in a browser-based lab',
      'Before/after: setup time for a diagnostic training session',
      'Customer-style demo: technician troubleshooting a simulated CAN fault',
    ],
    key_messages: [
      'Remote diagnostic training without shipping hardware',
      '~60% cost reduction vs legacy training rigs',
      'Faster lab setup for engineering and L&D teams',
    ],
    suggested_video_url: null,
    rationale:
      'Demo draft — set GROK_API_KEY_LUMEN on the server for live Grok-generated campaigns.',
    status: 'draft',
  };
}

/**
 * POST /api/ai/generate-campaign
 * Body: { brief_description, language?, mode?: 'full' | 'email_only', name?, target_audience? }
 */
router.post('/generate-campaign', async (req, res, next) => {
  try {
    const {
      brief_description,
      language = 'English',
      mode = 'full',
      name = '',
      target_audience = '',
    } = req.body || {};

    const brief = (brief_description || '').trim();
    const emailOnly = mode === 'email_only';

    if (emailOnly) {
      if (!name?.trim() || !target_audience?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Campaign name and target audience are required for email generation',
        });
      }
    } else if (!brief) {
      return res.status(400).json({
        success: false,
        error: 'brief_description is required (e.g. "Q1 2025 IoT Training Launch for automotive")',
      });
    }

    let campaign = buildDemoCampaign(brief || `${name} — ${target_audience}`, language);
    let meta = { source: 'demo' };

    if (process.env.GROK_API_KEY_LUMEN) {
      const userPrompt = emailOnly
        ? `MODE: email_only — Regenerate email subject variations and body only.

Campaign name: ${name}
Target audience: ${target_audience}
Language: ${language}

Include this exact CTA before the signature:
${WEBINAR_CTA}

Include this exact signature at the end:
${KG_SIGNATURE}

Return JSON:
{
  "email_subjects": ["variant 1", "variant 2", "variant 3"],
  "email_subject": "best primary subject",
  "email_body": "full email with CTA and signature"
}`
        : `MODE: full — Create a complete B2B campaign from this brief:
"${brief}"

Language: ${language}

Include this exact CTA in email_body before the signature:
${WEBINAR_CTA}

Include this exact signature at the end of email_body:
${KG_SIGNATURE}

Return JSON:
{
  "name": "campaign name",
  "target_audience": "specific audience description",
  "language": "${language}",
  "email_subjects": ["subject line 1", "subject line 2", "subject line 3"],
  "email_subject": "recommended primary subject",
  "email_body": "professional email body with CTA and signature",
  "video_url_suggestions": ["video idea 1", "video idea 2", "video idea 3"],
  "key_messages": ["bullet 1", "bullet 2", "bullet 3"],
  "suggested_video_url": "optional real YouTube search URL or null",
  "rationale": "2-3 sentences on strategy"
}`;

      const content = await callGrok(
        [{ role: 'user', content: userPrompt }],
        { tools: false, jsonMode: true, temperature: 0.35, systemPrompt: CAMPAIGN_SYSTEM_PROMPT }
      );

      const parsed = parseJson(content);
      if (parsed) {
        if (emailOnly) {
          campaign = {
            ...normalizeCampaignGeneration(
              { ...parsed, name, target_audience, language },
              { language }
            ),
            name: name.trim(),
            target_audience: target_audience.trim(),
          };
        } else {
          campaign = normalizeCampaignGeneration(parsed, { language });
        }
        meta = { source: 'grok' };
      }
    } else {
      meta.message = 'Set GROK_API_KEY_LUMEN for live Grok campaign generation';
    }

    res.json({ success: true, data: { campaign, meta } });
  } catch (err) {
    console.error('[ai/generate-campaign]', err.message);
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
            content: `Write a short personalized B2B email for KG ProTech. Tone: ${tone}. JSON only: { "subject", "body", "bodyHtml" }
Use only verified product claims (remote fault simulator, ~60% savings). No invented case studies.
Lead: ${JSON.stringify(lead)}
Campaign: ${JSON.stringify(campaign)}`,
          },
        ],
        { tools: false, systemPrompt: CAMPAIGN_SYSTEM_PROMPT }
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
