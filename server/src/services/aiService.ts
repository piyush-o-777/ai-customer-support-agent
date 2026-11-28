import { env } from '../config/env';
import { AIMessage } from '../types/chat.types';
import { HttpError } from '../utils/httpError';

const SYSTEM_PROMPT =
  'You are a helpful, concise, and polite AI customer support agent. Assist the user clearly and ask clarifying questions when needed.';

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
  delta?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

const mapProviderStatus = (status: number): HttpError => {
  if (status === 503 || status === 429) {
    return new HttpError(503, 'AI service is temporarily unavailable');
  }
  return new HttpError(502, 'AI provider returned an error');
};

export const generateReply = async (history: AIMessage[]): Promise<string> => {
  if (!env.aiApiKey) {
    throw new HttpError(503, 'AI service is not configured');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    const response = await fetch(`${env.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.aiModel,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw mapProviderStatus(response.status);
    }
    const data = (await response.json()) as ChatCompletionResponse;
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new HttpError(502, 'AI provider returned an empty response');
    }
    return reply;
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError(503, 'AI service timed out');
    }
    throw new HttpError(502, 'Failed to reach AI provider');
  } finally {
    clearTimeout(timeout);
  }
};

export const generateReplyStream = async (
  history: AIMessage[],
  onChunk: (chunk: string) => void
): Promise<string> => {
  if (!env.aiApiKey) {
    throw new HttpError(503, 'AI service is not configured');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    const response = await fetch(`${env.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.aiModel,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw mapProviderStatus(response.status);
    }
    if (!response.body) {
      throw new HttpError(502, 'AI provider returned an empty stream');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) {
          continue;
        }
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') {
          continue;
        }
        try {
          const parsed = JSON.parse(payload) as ChatCompletionResponse;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          continue;
        }
      }
    }
    const trimmed = fullText.trim();
    if (!trimmed) {
      throw new HttpError(502, 'AI provider returned an empty response');
    }
    return trimmed;
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError(503, 'AI service timed out');
    }
    throw new HttpError(502, 'Failed to reach AI provider');
  } finally {
    clearTimeout(timeout);
  }
};
