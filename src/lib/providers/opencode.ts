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
    
    // Clean up internal namespace prefix
    let targetModel = requestedModel.startsWith('opencode/')
      ? requestedModel.replace('opencode/', '')
      : requestedModel;

    // Handle generic 'free-model' or legacy IDs mapping to exact OpenCode Zen model
    if (targetModel === 'free-model' || targetModel === 'deepseek-r1-free' || targetModel === 'deepseek-v3-free') {
      targetModel = 'deepseek-v4-flash-free';
    }

    const payload = {
      ...reqBody,
      model: targetModel
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
      'User-Agent': 'Loreder-AI-Aggregator/1.0'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

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
                model: requestedModel,
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
                model: requestedModel,
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
        const errorData = err?.response?.data;
        let errorMsg = errorData?.error?.message || err.message || 'Failed to communicate with OpenCode Zen';

        if (status === 429) {
          errorMsg = `OpenCode Zen Rate Limit: The requested model '${targetModel}' is currently rate limited. Please try again in 15-30 seconds.`;
        }

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
            message: errorMsg,
            type: status === 429 ? 'rate_limit_exceeded' : 'upstream_error',
            code: status
          }
        }, { status });
      }
    } else {
      // Non-streaming response
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
          model: requestedModel,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          latencyMs,
          status: 'success'
        });

        return Response.json(response.data);
      } catch (err: any) {
        const status = err?.response?.status || 500;
        const errorData = err?.response?.data;
        let errorMsg = errorData?.error?.message || err.message || 'Upstream connection error';

        if (status === 429) {
          errorMsg = `OpenCode Zen Rate Limit: The requested model '${targetModel}' is currently rate limited. Please try again in 15-30 seconds.`;
        }

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
            message: errorMsg,
            type: status === 429 ? 'rate_limit_exceeded' : 'upstream_error',
            code: status
          }
        }, { status });
      }
    }
  }
}

export const openCodeProvider = new OpenCodeProvider();
