import { aiConfig } from '../../config/ai.js';
import { AiError } from '../errors.js';
import { OllamaProvider } from './ollama.js';
import { OpenAICompatibleProvider } from './openai.js';

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  'host.docker.internal',
]);

// "External" = the document text would leave this machine.
function isExternalUrl(url) {
  try {
    return !LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return true; // unparseable => treat as external (safe default)
  }
}

let cached = null;

// The ONLY place that knows which provider class exists. Business logic calls
// getProvider() and uses the shared contract; add a new provider here.
export function getProvider() {
  if (!aiConfig.enabled) {
    throw new AiError('AI_DISABLED', 'AI features are turned off on this server.', 503);
  }
  if (cached) return cached;

  let provider;
  if (aiConfig.provider === 'ollama') {
    const c = aiConfig.ollama;
    provider = new OllamaProvider(c, aiConfig.timeoutMs, isExternalUrl(c.baseUrl));
  } else if (aiConfig.provider === 'openai') {
    const c = aiConfig.openai;
    if (!c.baseUrl || !c.model || !c.embedModel) {
      throw new AiError(
        'AI_NOT_CONFIGURED',
        'The AI provider is not fully configured on the server.',
        503,
      );
    }
    provider = new OpenAICompatibleProvider(c, aiConfig.timeoutMs, isExternalUrl(c.baseUrl));
  } else {
    throw new AiError('AI_NOT_CONFIGURED', 'Unknown AI provider configured.', 503);
  }

  if (provider.external && !aiConfig.allowExternal) {
    throw new AiError(
      'AI_EXTERNAL_BLOCKED',
      'This server is configured not to send documents to external AI providers.',
      503,
    );
  }
  cached = provider;
  return provider;
}

export function providerHost(provider) {
  try {
    return new URL(provider.baseUrl).host;
  } catch {
    return 'an external AI provider';
  }
}

// Documents (or search queries) may only go to an external provider when the
// user explicitly confirmed it for this request.
export function assertConsent(provider, confirmed) {
  if (provider.external && confirmed !== true) {
    throw new AiError(
      'EXTERNAL_CONSENT_REQUIRED',
      'This will send document text to an external AI provider. Confirmation is required.',
      409,
      { providerHost: providerHost(provider) },
    );
  }
}
