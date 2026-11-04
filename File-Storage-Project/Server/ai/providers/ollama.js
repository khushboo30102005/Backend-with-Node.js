import { AiError } from '../errors.js';

// Local Ollama provider. Implements the provider contract used across the
// app: { name, model, embedModel, external, health(), chatJSON(), embed() }.
export class OllamaProvider {
  constructor(cfg, timeoutMs, external) {
    this.name = 'ollama';
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
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
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err?.name === 'TimeoutError') {
        throw new AiError(
          'AI_TIMEOUT',
          'The AI model took too long to respond. It may still be loading; try again in a minute.',
          504,
        );
      }
      console.log(`Ollama ${method} ${path} failed:`, err?.cause?.code || err?.message);
      throw new AiError('AI_OFFLINE', 'The AI service is offline or unreachable.', 503);
    }
    if (res.status === 404 && body?.model) {
      throw new AiError(
        'AI_MODEL_MISSING',
        `The AI model "${body.model}" is not installed on the AI server.`,
        503,
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.log(`Ollama ${method} ${path} returned ${res.status}:`, detail.slice(0, 300));
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
      const data = await this.#request('GET', '/api/tags', null, 2500);
      const names = (data.models || []).map((m) => m.name);
      const has = (n) => names.some((x) => x === n || x.startsWith(`${n}:`));
      return {
        reachable: true,
        modelReady: has(this.model) && has(this.embedModel),
      };
    } catch {
      return { reachable: false, modelReady: false };
    }
  }

  // Returns the raw JSON string produced by the model.
  async chatJSON(messages) {
    const data = await this.#request('POST', '/api/chat', {
      model: this.model,
      messages,
      stream: false,
      format: 'json',
      options: { temperature: 0.2, num_ctx: 8192 },
    });
    return data?.message?.content ?? '';
  }

  async embed(text) {
    const data = await this.#request('POST', '/api/embed', {
      model: this.embedModel,
      input: text,
    });
    const vec = data?.embeddings?.[0];
    if (!Array.isArray(vec) || vec.length === 0) {
      throw new AiError('AI_OFFLINE', 'The AI service returned no embedding.', 503);
    }
    return vec;
  }
}
