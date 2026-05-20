/**
 * Parse structured notes from Smart Lead Finder imports.
 */

function section(notes, header) {
  if (!notes) return '';
  const re = new RegExp(`---\\s*${header}\\s*---\\s*([\\s\\S]*?)(?=---\\s*|$)`, 'i');
  const m = notes.match(re);
  return m ? m[1].trim() : '';
}

export function parseLeadNotes(notes) {
  if (!notes?.trim()) {
    return {
      userNotes: '',
      fitReasoning: '',
      recentActivity: '',
      suggestedMessage: '',
      verificationNotes: '',
    };
  }

  const fitReasoning = section(notes, 'Fit reasoning');
  const recentActivity = section(notes, 'Recent activity');
  const suggestedMessage = section(notes, 'Suggested first message');
  const verificationNotes = section(notes, 'Verification notes');

  let userNotes = notes;
  const markers = [
    '--- Fit reasoning ---',
    '--- Recent activity ---',
    '--- Suggested first message ---',
    '--- Verification notes ---',
  ];
  const firstMarker = markers.map((m) => notes.indexOf(m)).filter((i) => i >= 0);
  if (firstMarker.length) {
    userNotes = notes.slice(0, Math.min(...firstMarker)).trim();
    userNotes = userNotes.replace(/^Confidence:.*\n*/i, '').trim();
  }

  return {
    userNotes,
    fitReasoning,
    recentActivity,
    suggestedMessage,
    verificationNotes,
  };
}
