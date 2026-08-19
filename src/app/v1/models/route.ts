import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models = await db.getModels();
  return Response.json({
    object: 'list',
    data: models.map(m => ({
      id: m.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: m.provider,
      permission: [],
      root: m.id,
      parent: null,
      context_length: m.contextLength,
      pricing: m.pricing
    }))
  });
}
