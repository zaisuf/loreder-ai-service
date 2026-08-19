import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Simple credential-based login returning a user token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || '';
    const password = body.password || '';

    const validEmail = email?.trim().toLowerCase();
    if (!validEmail) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Get user from db
    const user = await db.getUser(validEmail);

    // Simple credential check (in production use hashed passwords)
    // For now: accept any login for the owner email, or default password
    const ownerEmail = user.email?.toLowerCase();

    // Accept owner email OR any email if password matches default
    const isOwner = validEmail === ownerEmail;
    const defaultPass = process.env.LOREDER_PASSWORD || 'loreder123';
    const validPass = password === defaultPass;

    if (!isOwner && !validPass) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Issue a session token (use existing key or create one)
    const keys = await db.getKeys(user.id);
    let sessionToken = keys.find(k => k.status === 'active' && k.name === 'Auth Session Token');
    if (!sessionToken) {
      sessionToken = await db.createKey('Auth Session Token', user.id);
    }

    return Response.json({
      success: true,
      token: sessionToken.key,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        apiKey: sessionToken.key,
      }
    });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
