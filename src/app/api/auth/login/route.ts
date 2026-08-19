import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Simple credential-based login returning a user token
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Get user from db
    const user = db.getUser();

    // Simple credential check (in production use hashed passwords)
    // For now: accept any login for the owner email, or default password
    const validEmail = email?.trim().toLowerCase();
    const ownerEmail = user.email?.toLowerCase();

    if (!validEmail) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Accept owner email OR any email if password matches default
    const isOwner = validEmail === ownerEmail;
    const defaultPass = process.env.LOREDER_PASSWORD || 'loreder123';
    const validPass = password === defaultPass;

    if (!isOwner && !validPass) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Issue a session token (use existing key or create one)
    const keys = db.getKeys();
    let sessionToken = keys.find(k => k.status === 'active' && k.name === 'Auth Session Token');
    if (!sessionToken) {
      sessionToken = db.createKey('Auth Session Token');
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
