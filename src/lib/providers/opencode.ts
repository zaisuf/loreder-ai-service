import axios from 'axios';
import { db } from '../db';

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

// Healthy free model fallback chain if OpenCode Zen rate limits the primary requested model
const FREE_MODEL_FALLBACKS: Record<string, string[]> = {
  'deepseek-v4-flash-free': ['mimo-v2.5-free', 'nemotron-3.5-lightning-free', 'hy3-free', 'laguna-s-2.1-free'],
  'mimo-v2.5-free': ['deepseek-v4-flash-free', 'nemotron-3.5-lightning-free', 'hy3-free'],
  'nemotron-3.5-lightning-free': ['deepseek-v4-flash-free', 'mimo-v2.5-free', 'hy3-free']
};

export class OpenCodeProvider {
  private getProviderConfig() {
    const providers = db.getProviders();
    return providers.find(p => p.type === 'opencode' && p.isEnabled);
  }

  public async handleChatCompletion(
    reqBody: ChatCompletionRequest,
    keyId: string,
    keyName: string
  ): Promise<Response> {
    const startTime = Date.now();
    const config = this.getProviderConfig();

    const baseUrl = config?.baseUrl || 'https://opencode.ai/zen/v1';
    const apiKey = config?.apiKey || 'sk-Q4UnEZC03k6Okr2dlJ9Jp2ax7jgwNyZYBW8IAOcGaRjxYXEeE3Dvbfh56VjhHpFx';

    let requestedModel = reqBody.model || 'deepseek-v4-flash-free';
    
    let targetModel = requestedModel.startsWith('opencode/')
      ? requestedModel.replace('opencode/', '')
      : requestedModel;

    if (targetModel === 'free-model' || targetModel === 'deepseek-r1-free' || targetModel === 'deepseek-v3-free') {
      targetModel = 'deepseek-v4-flash-free';
    }

    // Build candidate list: Primary requested model first, then fallbacks if rate limited
    const candidates = [targetModel];
    const fallbacks = FREE_MODEL_FALLBACKS[targetModel] || ['mimo-v2.5-free', 'nemotron-3.5-lightning-free', 'hy3-free'];
    fallbacks.forEach(f => {
      if (!candidates.includes(f)) candidates.push(f);
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
      'User-Agent': 'Loreder-AI-Aggregator/1.0'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let lastError: any = null;

    for (const modelCandidate of candidates) {
      const payload = {
        ...reqBody,
        model: modelCandidate
      };

      if (reqBody.stream) {
        try {
          const response = await axios({
            method: 'post',
            url: `${baseUrl}/chat/completions`,
            data: payload,
            headers,
            responseType: 'stream',
            decompress: false,
            timeout: 60000
          });

          let totalCompletionLength = 0;

          const stream = new ReadableStream({
            async start(controller) {
              response.data.on('data', (chunk: Buffer) => {
                const chunkStr = chunk.toString();
                totalCompletionLength += chunkStr.length;
                controller.enqueue(chunk);
              });

              response.data.on('end', () => {
                controller.close();
                const latencyMs = Date.now() - startTime;
                const estimatedCompletionTokens = Math.ceil(totalCompletionLength / 4);
                const promptLength = JSON.stringify(reqBody.messages).length;
                const estimatedPromptTokens = Math.ceil(promptLength / 4);

                db.logUsage({
                  keyId,
                  keyName,
                  model: `opencode/${modelCandidate}`,
                  promptTokens: estimatedPromptTokens,
                  completionTokens: estimatedCompletionTokens,
                  totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                  latencyMs,
                  status: 'success'
                });
              });

              response.data.on('error', (err: any) => {
                console.error('Stream error:', err?.message || err);
                const errPayload = `data: ${JSON.stringify({ error: { message: err?.message || 'Stream error from OpenCode Zen' } })}\n\n`;
                controller.enqueue(new TextEncoder().encode(errPayload));
                controller.close();

                db.logUsage({
                  keyId,
                  keyName,
                  model: `opencode/${modelCandidate}`,
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                  latencyMs: Date.now() - startTime,
                  status: 'error'
                });
              });
            }
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        } catch (err: any) {
          const status = err?.response?.status || 500;
          lastError = err;

          // If rate limited (429), try next fallback free candidate
          if (status === 429 && candidates.indexOf(modelCandidate) < candidates.length - 1) {
            console.warn(`[Loreder Smart Router] '${modelCandidate}' rate limited on OpenCode Zen. Auto-routing to next candidate '${candidates[candidates.indexOf(modelCandidate) + 1]}'...`);
            continue;
          }
          break;
        }
      } else {
        // Non-streaming
        try {
          const response = await axios({
            method: 'post',
            url: `${baseUrl}/chat/completions`,
            data: payload,
            headers,
            timeout: 60000
          });

          const latencyMs = Date.now() - startTime;
          const usage = response.data.usage || {
            prompt_tokens: Math.ceil(JSON.stringify(reqBody.messages).length / 4),
            completion_tokens: Math.ceil(JSON.stringify(response.data.choices?.[0]?.message || '').length / 4),
            total_tokens: 0
          };
          usage.total_tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);

          db.logUsage({
            keyId,
            keyName,
            model: `opencode/${modelCandidate}`,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            latencyMs,
            status: 'success'
          });

          return Response.json(response.data);
        } catch (err: any) {
          const status = err?.response?.status || 500;
          lastError = err;

          if (status === 429 && candidates.indexOf(modelCandidate) < candidates.length - 1) {
            console.warn(`[Loreder Smart Router] '${modelCandidate}' rate limited. Trying next fallback candidate...`);
            continue;
          }
          break;
        }
      }
    }

    // Exhausted all options
    const status = lastError?.response?.status || 429;
    const rawMsg = lastError?.response?.data?.error?.message || lastError?.message || 'OpenCode Zen rate limit reached';

    db.logUsage({
      keyId,
      keyName,
      model: requestedModel,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startTime,
      status: 'error'
    });

    return Response.json({
      error: {
        message: `[OpenCode Zen Busy] ${rawMsg}. OpenCode Zen free tier servers are experiencing high traffic. Please try again in 15-30 seconds.`,
        type: 'rate_limit_exceeded',
        code: status
      }
    }, { status });
  }
}

export const openCodeProvider = new OpenCodeProvider();
