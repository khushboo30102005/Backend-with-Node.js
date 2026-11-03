# AI-Powered File Intelligence — Setup & Integration

## 1. What was added
All files and integration edits are already applied on this branch (routes mounted in `app.js`, delete cleanup hooks, `setup:ai` script, `pdf-parse`/`mammoth` deps, Details panel, Smart search button in the top bar). The Smart search button appears only when the server reports `AI_ENABLED=true`.

## 2. Environment (Server/.env)

```
AI_ENABLED=true
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_EMBED_MODEL=nomic-embed-text
# Optional tuning: AI_TIMEOUT_MS, AI_MAX_FILE_BYTES, AI_MAX_PROMPT_CHARS, AI_MAX_QUEUE, AI_SEARCH_MIN_SCORE

# Hosted OpenAI-compatible alternative (documents leave your server!)
# AI_PROVIDER=openai
# AI_BASE_URL=https://<host>/v1
# AI_API_KEY=...
# AI_MODEL=...   AI_EMBED_MODEL=...
# AI_ALLOW_EXTERNAL=true   # required, plus per-request user confirmation
```

## 3. Run

```
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
cd Server && npm run setup:ai && npm run dev
```

## 4. Behaviour & limits
- Analysis is owner-only; editors/viewers can read insights; search covers own + shared, non-trashed files.
- Non-local AI hosts count as external: blocked unless `AI_ALLOW_EXTERNAL=true` AND the user confirms each request (409 `EXTERNAL_CONSENT_REQUIRED`).
- AI offline/model missing → clear message, nothing is sent anywhere.
- Supported: text/md/code/html, PDF (≤40 pages), DOCX; ≤10 MB. Scanned PDFs (OCR) unsupported.
- Render free tier cannot run Ollama: the deployed app shows "AI offline" unless Ollama is exposed separately (then it is "external" and needs the consent flags). Local demo works fully.
- Not yet done (next stages): auto-analyze on upload, row category chips (use `/ai/insights/batch`), Settings → AI section, tests.
