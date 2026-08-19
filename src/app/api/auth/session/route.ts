import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Validate a token and return user info - used by app-1 and VS Code extension
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();

  if (!token) {
    return Response.json({ error: 'No token provided' }, { status: 401 });
  }

  const key = db.validateKey(token);
  if (!key) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const user = db.getUser();
  return Response.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      apiKey: token,
    }
  });
}
