// All AI settings come from environment variables. Nothing here is a secret
// and no provider URL or key is hardcoded (the Ollama URL below is only a
// conventional local fallback; override it with OLLAMA_BASE_URL).

const bool = (v, d = false) =>
  v === undefined || v === '' ? d : String(v).toLowerCase() === 'true';
const int = (v, d) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const aiConfig = {
  // Master switch. Off by default so nothing changes until you opt in.
  enabled: bool(process.env.AI_ENABLED, false),
  // 'ollama' (local, default) | 'openai' (any OpenAI-compatible API)
  provider: (process.env.AI_PROVIDER || 'ollama').toLowerCase(),
  // Documents may only leave this machine/network when this is true AND the
  // user confirms in the UI for that request.
  allowExternal: bool(process.env.AI_ALLOW_EXTERNAL, false),

  timeoutMs: int(process.env.AI_TIMEOUT_MS, 120000),
  maxFileBytes: int(process.env.AI_MAX_FILE_BYTES, 10 * 1024 * 1024),
  maxPromptChars: int(process.env.AI_MAX_PROMPT_CHARS, 12000),
  maxQueue: int(process.env.AI_MAX_QUEUE, 50),
  searchMinScore: num(process.env.AI_SEARCH_MIN_SCORE, 0.5),

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },

  openai: {
    baseUrl: process.env.AI_BASE_URL, // e.g. https://host/v1
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
    embedModel: process.env.AI_EMBED_MODEL,
  },
};
