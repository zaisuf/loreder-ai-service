import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return Response.json(await db.getKeys());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const newKey = await db.createKey(body.name);
  return Response.json(newKey, { status: 201 });
}
