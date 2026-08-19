import { db } from '@/lib/db';

export async function GET() {
  const models = db.getModels();
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
