import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await req.json();
  const updated = db.updateProvider(id, updates);
  if (updated) {
    return Response.json(updated);
  }
  return Response.json({ error: 'Provider not found' }, { status: 404 });
}
