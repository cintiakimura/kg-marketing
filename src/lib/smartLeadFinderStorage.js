const TEMPLATES_KEY = 'kg_marketing_smart_lead_templates';

export function loadSearchTemplates() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSearchTemplate(template) {
  const templates = loadSearchTemplates();
  const entry = {
    id: template.id || `tpl_${Date.now()}`,
    name: template.name || 'Untitled search',
    savedAt: new Date().toISOString(),
    icp: template.icp,
  };
  const existing = templates.findIndex((t) => t.id === entry.id);
  if (existing >= 0) templates[existing] = entry;
  else templates.unshift(entry);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates.slice(0, 20)));
  return entry;
}

export function deleteSearchTemplate(id) {
  const templates = loadSearchTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}
