import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { openCodeProvider } from '@/lib/providers/opencode';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({
      error: {
        message: 'Missing or invalid Authorization header. Must be "Bearer <API_KEY>"',
        type: 'authentication_error',
        code: 401
      }
    }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const validKey = await db.validateKey(token);

  if (!validKey) {
    return Response.json({
      error: {
        message: 'Invalid API key provided.',
        type: 'authentication_error',
        code: 401
      }
    }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return Response.json({
        error: {
          message: 'Missing required field: "messages" array',
          type: 'invalid_request_error',
          code: 400
        }
      }, { status: 400 });
    }

    if (!body.model) {
      body.model = 'opencode/free-model';
    }

    return await openCodeProvider.handleChatCompletion(body, validKey.id, validKey.name);
  } catch (err: any) {
    return Response.json({
      error: {
        message: err.message || 'Invalid JSON body',
        type: 'invalid_request_error',
        code: 400
      }
    }, { status: 400 });
  }
}
