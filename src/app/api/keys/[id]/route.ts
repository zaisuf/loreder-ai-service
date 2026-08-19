import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = await db.revokeKey(id);
  if (success) {
    return Response.json({ success: true, message: 'Key revoked' });
  }
  return Response.json({ error: 'Key not found' }, { status: 404 });
}
