import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return Response.json(db.getUser());
}

export async function PUT(req: NextRequest) {
  const updates = await req.json();
  const updatedUser = db.updateUser(updates);
  return Response.json(updatedUser);
}
