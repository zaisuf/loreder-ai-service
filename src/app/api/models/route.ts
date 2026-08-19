import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await db.getModels());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, name, provider, contextLength, description } = body;
  if (!id || !name) {
    return Response.json({ error: 'Model ID and Name are required' }, { status: 400 });
  }

  const newModel = await db.addModel({
    id,
    name,
    provider: provider || 'Custom Provider',
    contextLength: contextLength || 32768,
    isFree: true,
    pricing: { prompt: 0, completion: 0 },
    description: description || 'Custom added model'
  });

  return Response.json(newModel, { status: 201 });
}
