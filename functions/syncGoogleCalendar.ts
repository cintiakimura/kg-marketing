/**
 * Google Calendar sync/create server function for KG Marketing.
 * Google API helpers are retained; auth, OAuth tokens, and persistence must be wired to your backend.
 */

async function fetchCalendarEvents(accessToken) {
  const timeMin = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=50&orderBy=startTime&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const data = await response.json();
  if (!data.items) return [];

  return data.items.map(event => ({
    title: event.summary || 'No Title',
    description: event.description || '',
    start_time: event.start.dateTime || event.start.date,
    end_time: event.end.dateTime || event.end.date,
    meeting_link: event.hangoutLink || event.htmlLink || '',
    host_name: event.organizer?.displayName || event.organizer?.email || 'Unknown',
    attendees: event.attendees?.map(a => ({
      name: a.displayName || a.email,
      email: a.email,
      registered_at: new Date().toISOString()
    })) || []
  }));
}

async function createCalendarEvent(accessToken, event) {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start_time,
          timeZone: 'Europe/Paris'
        },
        end: {
          dateTime: event.end_time,
          timeZone: 'Europe/Paris'
        },
        attendees: event.attendees?.map(a => ({ email: a.email })) || [],
        conferenceData: {
          createRequest: {
            requestId: `webinar-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      })
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

    const { action, event } = await req.json();

    // TODO: Replace with your own Google Calendar OAuth token provider
    const accessToken = ''; // e.g. await getGoogleCalendarAccessToken(user);

    if (action === 'sync') {
      const events = await fetchCalendarEvents(accessToken);

      for (const evt of events) {
        // TODO: Replace with your own API to check for duplicate Webinar records
        const existing = []; // e.g. await db.webinars.findBy({ title, start_time })

        if (existing.length === 0) {
          // TODO: Replace with your own API to create Webinar records
          void evt;
        }
      }

      return Response.json({
        success: true,
        synced: events.length
      });
    }

    if (action === 'create') {
      const result = await createCalendarEvent(accessToken, event);

      // TODO: Replace with your own API to create Webinar records after calendar event creation
      const webinar = {
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        meeting_link: result.hangoutLink || result.htmlLink,
        host_name: event.host_name || 'Cintia Kimura',
        attendees: event.attendees || []
      };

      return Response.json({
        success: true,
        webinar,
        googleEventId: result.id
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
