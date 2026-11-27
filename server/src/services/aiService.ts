import { env } from '../config/env';
import { AIMessage } from '../types/chat.types';
import { HttpError } from '../utils/httpError';

const SYSTEM_PROMPT =
  'You are a helpful, concise, and polite AI customer support agent. Assist the user clearly and ask clarifying questions when needed.';

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

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
      if (response.status === 503 || response.status === 429) {
        throw new HttpError(503, 'AI service is temporarily unavailable');
      }
      throw new HttpError(502, 'AI provider returned an error');
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
