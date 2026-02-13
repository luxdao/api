import { Hono } from 'hono';
import { Address } from 'viem';

interface TownHallSession {
  id: string;
  title: string;
  description: string;
  daoAddress: Address;
  creator: Address;
  presenter: Address;
  status: 'scheduled' | 'live' | 'ended';
  startTime: number;
  endTime?: number;
}

// In-memory store — replace with database persistence
const sessions = new Map<string, TownHallSession>();

const townHallRoutes = new Hono();

/**
 * List all sessions for a DAO.
 * GET /town-hall/sessions?dao=0x...
 */
townHallRoutes.get('/sessions', async c => {
  const daoAddress = c.req.query('dao');
  if (!daoAddress) {
    return c.json({ error: 'Missing dao query parameter' }, 400);
  }

  const daoSessions = Array.from(sessions.values()).filter(
    s => s.daoAddress.toLowerCase() === daoAddress.toLowerCase(),
  );

  return c.json({ sessions: daoSessions });
});

/**
 * Create a new town hall session.
 * POST /town-hall/sessions
 */
townHallRoutes.post('/sessions', async c => {
  const body = await c.req.json<{
    title: string;
    description: string;
    daoAddress: Address;
    creator: Address;
    presenter: Address;
    startTime: number;
  }>();

  const session: TownHallSession = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    daoAddress: body.daoAddress,
    creator: body.creator,
    presenter: body.presenter,
    status: 'scheduled',
    startTime: body.startTime,
  };

  sessions.set(session.id, session);
  return c.json({ session }, 201);
});

/**
 * Join a session (returns LiveKit room token).
 * POST /town-hall/sessions/:id/join
 */
townHallRoutes.post('/sessions/:id/join', async c => {
  const sessionId = c.req.param('id');
  const session = sessions.get(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  // TODO: Verify DAO membership and generate LiveKit token
  // See livekit.ts for token generation

  return c.json({
    session,
    token: '', // placeholder
    roomName: `townhall-${session.daoAddress}-${session.id}`,
  });
});

/**
 * End a session.
 * POST /town-hall/sessions/:id/end
 */
townHallRoutes.post('/sessions/:id/end', async c => {
  const sessionId = c.req.param('id');
  const session = sessions.get(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  session.status = 'ended';
  session.endTime = Date.now();
  sessions.set(sessionId, session);

  return c.json({ session });
});

export { townHallRoutes };
