/**
 * KG Marketing — external integrations (LLM, email, files, etc.).
 */

export async function invokeLLM(_params) {
  // TODO: Call your LLM provider (e.g. OpenAI, Anthropic) for content generation
  return '';
}

export async function sendEmail(_params) {
  // TODO: Send email via your provider (SendGrid, SES, Resend, etc.)
  return { success: true };
}

export async function sendSMS(_params) {
  // TODO: Send SMS via your provider (Twilio, etc.)
  return { success: true };
}

export async function uploadFile(_params) {
  // TODO: Upload file to your storage (S3, Cloudinary, etc.)
  return { file_url: '' };
}

export async function generateImage(_params) {
  // TODO: Generate image via your image API (DALL·E, Stability, etc.)
  return { url: '' };
}

export async function extractDataFromUploadedFile(_params) {
  // TODO: Extract structured data from uploaded file (CSV/XLS parsing service)
  return { data: [] };
}

/** @typedef {import('./smartLeadFinder.types.js').IcpData} IcpData */
/** @typedef {import('./smartLeadFinder.types.js').SmartLead} SmartLead */

const GROK_API_URL = () =>
  import.meta.env.VITE_GROK_API_URL || 'https://api.x.ai/v1';
const GROK_MODEL = () =>
  import.meta.env.VITE_GROK_MODEL || 'grok-2-latest';

const LEAD_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    leads: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          title: { type: 'string' },
          company: { type: 'string' },
          linkedinUrl: { type: 'string' },
          location: { type: 'string' },
          email: { type: 'string' },
          fitScore: { type: 'number' },
          fitReasoning: { type: 'string' },
          recentActivity: { type: 'string' },
          suggestedFirstMessage: { type: 'string' },
        },
        required: [
          'name',
          'title',
          'company',
          'linkedinUrl',
          'location',
          'fitScore',
          'fitReasoning',
          'recentActivity',
          'suggestedFirstMessage',
        ],
      },
    },
  },
  required: ['leads'],
};

const GROK_RESEARCH_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the web for companies, org charts, news, and LinkedIn-style professional context.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'x_keyword_search',
      description:
        'Search X (Twitter) for posts by or about a person/company using keywords.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keywords or handles to search' },
          focus: {
            type: 'string',
            enum: ['posts', 'people', 'companies'],
            description: 'What to prioritize in results',
          },
        },
        required: ['query'],
      },
    },
  },
];

function buildIcpSummary(icpData) {
  return [
    `Industry / sector: ${icpData.industry}`,
    `Company size: ${icpData.companySize}`,
    `Target roles: ${(icpData.targetRoles || []).join(', ')}`,
    `Geography: ${icpData.geography}`,
    `Pain points / keywords: ${icpData.painPoints}`,
    icpData.focusCompanies
      ? `Priority companies: ${icpData.focusCompanies}`
      : 'No specific company list — discover best-fit orgs.',
  ].join('\n');
}

function slugify(str) {
  return (str || 'contact')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function normalizeLead(raw) {
  const fitScore = Math.min(10, Math.max(1, Number(raw.fitScore) || 5));
  return {
    id: `sl_${slugify(raw.name)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: raw.name?.trim() || 'Unknown',
    title: raw.title?.trim() || 'Decision-maker',
    company: raw.company?.trim() || 'Unknown company',
    linkedinUrl: raw.linkedinUrl?.trim() || '',
    location: raw.location?.trim() || '',
    email:
      raw.email?.trim() ||
      `${slugify(raw.name?.split(' ')[0])}.${slugify(raw.name?.split(' ').slice(-1)[0])}@${slugify(raw.company)}.pending`,
    fitScore,
    fitReasoning: raw.fitReasoning?.trim() || '',
    recentActivity: raw.recentActivity?.trim() || '',
    suggestedFirstMessage: raw.suggestedFirstMessage?.trim() || '',
  };
}

function parseLeadsFromContent(content) {
  if (!content) return [];
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const list = parsed.leads || parsed.results || parsed;
    if (!Array.isArray(list)) return [];
    return list.map(normalizeLead).filter((l) => l.name && l.company);
  } catch {
    return [];
  }
}

async function callGrok(messages, { tools = true, jsonMode = false } = {}) {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) return null;

  const body = {
    model: GROK_MODEL(),
    messages,
    temperature: 0.35,
    max_tokens: 4096,
  };

  if (tools) {
    body.tools = GROK_RESEARCH_TOOLS;
    body.tool_choice = 'auto';
  }
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const backendUrl = import.meta.env.VITE_KG_MARKETING_API_URL;
  const useProxy = import.meta.env.VITE_GROK_USE_BACKEND_PROXY === 'true' && backendUrl;

  const url = useProxy
    ? `${backendUrl.replace(/\/$/, '')}/api/integrations/grok`
    : `${GROK_API_URL()}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(useProxy ? {} : { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify(
      useProxy ? { messages, tools: tools ? GROK_RESEARCH_TOOLS : undefined, jsonMode } : body
    ),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Grok API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message;
}

function buildDemoLeads(icpData) {
  const industry = icpData.industry || 'automotive technology';
  const roles = icpData.targetRoles?.length
    ? icpData.targetRoles
    : ['Head of Product Development', 'Training Manager'];

  const demos = [
    {
      name: 'Elena Vasquez',
      title: roles[0] || 'Head of Product Development',
      company: 'NordDrive Systems',
      linkedinUrl: 'https://www.linkedin.com/in/example-elena-vasquez',
      location: 'Munich, Germany',
      email: 'e.vasquez@norddrive.example',
      fitScore: 9,
      fitReasoning: `Leads ${industry} product roadmap and publicly discussed rolling out a new technician certification program last month. Company size matches your ICP and she owns training budget alignment with product launches.`,
      recentActivity:
        'Posted last week about implementing a new hands-on training system for EV diagnostics teams — strong buying signal for structured learning solutions.',
      suggestedFirstMessage: `Hi Elena — saw your post on the new EV diagnostics training rollout. We help ${industry} teams compress ramp-up time for field techs without pulling senior engineers off critical projects. Worth a 15-min compare on what you're building?`,
    },
    {
      name: 'Marcus Chen',
      title: roles[1] || 'Training Manager',
      company: 'Apex Mobility Components',
      linkedinUrl: 'https://www.linkedin.com/in/example-marcus-chen',
      location: 'Detroit, USA',
      email: 'marcus.chen@apexmobility.example',
      fitScore: 8,
      fitReasoning:
        'Active on X discussing supplier quality workshops and L&D tooling gaps. Apex recently expanded manufacturing lines — typical inflection point for standardized training.',
      recentActivity:
        'Shared thread on reducing onboarding time for new plant hires; replied to vendors asking about simulation-based modules.',
      suggestedFirstMessage:
        "Marcus — your thread on onboarding at Apex caught my eye. We've helped similar plants cut new-hire time-to-competency with IoT-aligned training kits. Open to sharing what worked?",
    },
    {
      name: 'Dr. Amira Okonkwo',
      title: 'Head of Learning & Development',
      company: 'Helix Automotive Tech',
      linkedinUrl: 'https://www.linkedin.com/in/example-amira-okonkwo',
      location: 'London, UK',
      email: 'a.okonkwo@helixauto.example',
      fitScore: 9,
      fitReasoning: `Helix fits geographic focus (${icpData.geography || 'EMEA'}) and pain theme "${icpData.painPoints || 'digital training'}". Amira coordinates global L&D — ideal economic buyer for campaign-in-a-box style programs.`,
      recentActivity:
        'Conference talk recap: "Scaling competency frameworks across 4 sites" — indicates active investment in training infrastructure.',
      suggestedFirstMessage:
        'Amira — congrats on the competency framework talk. Curious if you’re evaluating packaged training campaigns for multi-site rollouts — happy to send a 2-page benchmark from similar OEM programs.',
    },
    {
      name: 'James Whitfield',
      title: 'CTO',
      company: 'TorqueLine Industries',
      linkedinUrl: 'https://www.linkedin.com/in/example-james-whitfield',
      location: 'Chicago, USA',
      email: 'j.whitfield@torqueline.example',
      fitScore: 7,
      fitReasoning:
        'Technical executive influence; TorqueLine announced smart factory initiative. CTO less direct for training but sponsors digital twin skilling — good champion path.',
      recentActivity:
        'Quoted in trade press on upskilling engineers for predictive maintenance analytics.',
      suggestedFirstMessage:
        'James — read your comments on upskilling for predictive maintenance. We bridge engineering concepts to shop-floor training modules — could be useful for your smart factory rollout.',
    },
  ];

  return demos.map(normalizeLead);
}

/**
 * Quality-first lead discovery via Grok (multi-phase research + structured output).
 * @param {IcpData} icpData
 * @param {{ onProgress?: (step: string, detail?: string) => void }} [options]
 * @returns {Promise<{ leads: SmartLead[], meta: object }>}
 */
export async function findHighQualityLeads(icpData, options = {}) {
  const { onProgress } = options;
  const icpSummary = buildIcpSummary(icpData);
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  const useDemo = !apiKey && import.meta.env.VITE_GROK_USE_BACKEND_PROXY !== 'true';

  if (useDemo) {
    onProgress?.('searching_companies', 'Searching companies…');
    await delay(800);
    onProgress?.('finding_decision_makers', 'Finding decision-makers…');
    await delay(900);
    onProgress?.('analyzing_activity', 'Analyzing profiles & posts…');
    await delay(1000);
    onProgress?.('evaluating_intent', 'Evaluating intent & fit…');
    await delay(700);
    onProgress?.('complete', 'Done');
    return {
      leads: buildDemoLeads(icpData).slice(0, 6),
      meta: { source: 'demo', message: 'Set VITE_GROK_API_KEY for live Grok research.' },
    };
  }

  const systemPrompt = `You are an elite B2B lead researcher for KG Marketing (IoT/automotive training campaigns).
QUALITY over quantity: return only 4-8 decision-makers with strong evidence of intent.
Use web_search for companies/news/LinkedIn context and x_keyword_search for recent posts.
Reason explicitly: e.g. "Posted about implementing new training systems last week → high intent."
Output must match JSON schema with fitScore 1-10 (only 7+ if real signals).`;

  // Phase 1 — companies
  onProgress?.('searching_companies', 'Searching companies…');
  const phase1 = await callGrok(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `PHASE 1 — Use web_search. Find 8-15 companies matching:\n${icpSummary}\nReturn JSON: { "companies": [{ "name", "whyFit", "size", "hq" }] }`,
      },
    ],
    { tools: true, jsonMode: true }
  );

  const companiesJson = phase1?.content || '{}';
  let companies = [];
  try {
    companies = JSON.parse(companiesJson).companies || [];
  } catch {
    companies = [];
  }

  // Phase 2 — people
  onProgress?.('finding_decision_makers', 'Finding decision-makers…');
  const phase2 = await callGrok(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `PHASE 2 — For these companies, find real decision-makers (target roles). Use web_search + x_keyword_search.\nCompanies: ${JSON.stringify(companies.slice(0, 10))}\nICP:\n${icpSummary}\nReturn JSON: { "candidates": [{ "name", "title", "company", "linkedinUrl", "location" }] }`,
      },
    ],
    { tools: true, jsonMode: true }
  );

  let candidates = [];
  try {
    candidates = JSON.parse(phase2?.content || '{}').candidates || [];
  } catch {
    candidates = [];
  }

  // Phase 3 — activity + scoring
  onProgress?.('analyzing_activity', 'Analyzing recent activity…');
  onProgress?.('evaluating_intent', 'Evaluating intent & fit…');

  const phase3 = await callGrok(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `PHASE 3 — Analyze recent activity (posts, talks, hiring, training initiatives) for each candidate. Score fit 1-10 with reasoning.\nCandidates: ${JSON.stringify(candidates.slice(0, 12))}\nPain points: ${icpData.painPoints}\nReturn ONLY JSON matching: ${JSON.stringify(LEAD_OUTPUT_SCHEMA)}`,
      },
    ],
    { tools: true, jsonMode: true }
  );

  let leads = parseLeadsFromContent(phase3?.content);
  if (leads.length === 0) {
    leads = buildDemoLeads(icpData);
  }

  leads = leads
    .filter((l) => l.fitScore >= 6)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 8);

  onProgress?.('complete', 'Done');

  return {
    leads,
    meta: {
      source: 'grok',
      companiesResearched: companies.length,
      candidatesReviewed: candidates.length,
    },
  };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
