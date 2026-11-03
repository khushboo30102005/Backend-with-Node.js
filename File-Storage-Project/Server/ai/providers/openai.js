import { AiError } from '../errors.js';

// Any OpenAI-compatible API (OpenAI, Groq, LM Studio, vLLM, llama.cpp server…).
// baseUrl must include the version segment, e.g. https://host/v1
export class OpenAICompatibleProvider {
  constructor(cfg, timeoutMs, external) {
    this.name = 'openai';
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
    this.apiKey = cfg.apiKey;
    this.model = cfg.model;
    this.embedModel = cfg.embedModel;
    this.timeoutMs = timeoutMs;
    this.external = external;
  }

  async #request(method, path, body, timeoutMs = this.timeoutMs) {
    let res;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new AiError('AI_OFFLINE', 'The AI service is offline or unreachable.', 503);
    }
    if (res.status === 401 || res.status === 403) {
      throw new AiError('AI_AUTH', 'The AI provider rejected the server credentials.', 503);
    }
    if (res.status === 429) {
      throw new AiError('AI_RATE_LIMITED', 'The AI provider is rate limiting requests. Try again shortly.', 503);
    }
    if (!res.ok) {
      throw new AiError('AI_OFFLINE', `The AI service returned an error (${res.status}).`, 503);
    }
    try {
      return await res.json();
    } catch {
      throw new AiError('AI_OFFLINE', 'The AI service sent an invalid response.', 503);
    }
  }

  async health() {
    try {
      await this.#request('GET', '/models', null, 2500);
      return { reachable: true, modelReady: Boolean(this.model && this.embedModel) };
    } catch (err) {
      // A reachable server that rejects the key is still "reachable".
      return { reachable: err.code === 'AI_AUTH', modelReady: false };
    }
  }

  async chatJSON(messages) {
    const data = await this.#request('POST', '/chat/completions', {
      model: this.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    return data?.choices?.[0]?.message?.content ?? '';
  }

  async embed(text) {
    const data = await this.#request('POST', '/embeddings', {
      model: this.embedModel,
      input: text,
    });
    const vec = data?.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length === 0) {
      throw new AiError('AI_OFFLINE', 'The AI service returned no embedding.', 503);
    }
    return vec;
  }
}
