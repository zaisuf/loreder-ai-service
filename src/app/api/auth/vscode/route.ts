import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const extensionName = body.extensionName || 'VS Code Extension';
  
  // Create or retrieve key for extension
  const newKey = await db.createKey(`VS Code Auth (${extensionName})`);
  
  const deepLinkUri = `vscode://zaisuf.loreder-ai-service/auth?token=${newKey.key}&endpoint=${encodeURIComponent('http://localhost:3000/v1')}`;

  return Response.json({
    success: true,
    token: newKey.key,
    endpoint: 'http://localhost:3000/v1',
    deepLinkUri,
    user: await db.getUser()
  });
}
