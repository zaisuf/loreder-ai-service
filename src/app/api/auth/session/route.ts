import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// Validate a token or session and return user info
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  // 1. If API key / Bearer token is provided
  if (token) {
    const key = await db.validateKey(token);
    if (!key) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await db.getUser(key.userId);
    return Response.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        image: user.avatar,
        avatar: user.avatar,
        apiKey: token,
      }
    });
  }

  // 2. Check NextAuth (Google Login) session cookie
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await db.getUser(session.user.email);
      return Response.json({
        authenticated: true,
        user: {
          id: user.id,
          name: session.user.name || user.name,
          email: session.user.email,
          role: user.role,
          bio: user.bio,
          avatar: session.user.image || user.avatar,
          apiKey: user.apiKey,
        }
      });
    }
  } catch (e) {
    console.error('Session auth check error:', e);
  }

  return Response.json({ error: 'No active session or token' }, { status: 401 });
}
