/**
 * Gmail sync/send server function for KG Marketing.
 * Google API helpers are retained; auth and persistence must be wired to your backend.
 */

async function getAccessToken() {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials. Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in environment variables.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${data.error_description || data.error || 'Unknown error'}`);
  }

  return data.access_token;
}

async function fetchGmailMessages(accessToken, maxResults = 10) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const data = await response.json();
  if (!data.messages) return [];

  const messages = [];
  for (const msg of data.messages) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    messages.push(await msgResponse.json());
  }

  return messages.map(msg => {
    const headers = msg.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    return {
      subject: getHeader('Subject'),
      from_email: getHeader('From').match(/<(.+?)>/)?.[1] || getHeader('From'),
      to_email: getHeader('To').match(/<(.+?)>/)?.[1] || getHeader('To'),
      date: getHeader('Date'),
      body: msg.snippet || '',
      folder: msg.labelIds?.includes('SENT') ? 'sent' : 'inbox',
      is_read: !msg.labelIds?.includes('UNREAD')
    };
  });
}

async function sendGmailMessage(accessToken, to, subject, body) {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body
  ].join('\r\n');

  const encodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    }
  );

  return response.json();
}

Deno.serve(async (req) => {
  try {
    // TODO: Replace with your own auth middleware to verify the request user
    const user = null; // e.g. await verifyAuth(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, to, subject, body } = await req.json();
    const accessToken = await getAccessToken();

    if (action === 'sync') {
      const maxResults = 10;
      const messages = await fetchGmailMessages(accessToken, maxResults);

      for (const msg of messages) {
        // TODO: Replace with your own API to check for duplicate EmailMessage records
        const existing = []; // e.g. await db.emailMessages.findBy({ subject, from_email, date })

        if (existing.length === 0) {
          // TODO: Replace with your own API to create EmailMessage records
          void msg;
        }
      }

      return Response.json({
        success: true,
        synced: messages.length
      });
    }

    if (action === 'send') {
      const result = await sendGmailMessage(accessToken, to, subject, body);

      // TODO: Replace with your own API to persist sent EmailMessage records
      void {
        subject,
        from_email: 'info@kgprotech.com',
        to_email: to,
        body,
        folder: 'sent',
        is_read: true,
        date: new Date().toISOString()
      };

      return Response.json({ success: true, messageId: result.id });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Gmail sync error:', error);
    return Response.json({
      error: error.message || 'Unknown error',
      details: error.stack
    }, { status: 500 });
  }
});
