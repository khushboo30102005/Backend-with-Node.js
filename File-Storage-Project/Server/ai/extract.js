import { aiConfig } from '../config/ai.js';
import { AiError } from './errors.js';

const TEXT_EXT = new Set([
  '.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.yml', '.yaml', '.log',
  '.js', '.jsx', '.ts', '.tsx', '.css', '.py', '.java',
]);
const HTML_EXT = new Set(['.html', '.htm']);
const PDF_EXT = new Set(['.pdf']);
const DOCX_EXT = new Set(['.docx']);

const MAX_EXTRACTED_CHARS = 200_000; // hard cap on what we keep in memory
const EXTRACT_TIMEOUT_MS = 30_000;
const MAX_PDF_PAGES = 40;

export function isSupportedExtension(ext) {
  const e = String(ext || '').toLowerCase();
  return TEXT_EXT.has(e) || HTML_EXT.has(e) || PDF_EXT.has(e) || DOCX_EXT.has(e);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new AiError('EXTRACTION_FAILED', 'Reading this document took too long.', 422)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function normalize(text) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_EXTRACTED_CHARS);
}

function decodeText(buffer) {
  const sample = buffer.subarray(0, 4096);
  let nul = 0;
  for (const b of sample) if (b === 0) nul += 1;
  if (sample.length > 0 && nul / sample.length > 0.01) {
    throw new AiError('UNSUPPORTED_FORMAT', 'This file looks binary, not text.', 422);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

// Never executes or renders anything: HTML is reduced to its visible text with
// plain string operations.
function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|br|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function pdfToText(buffer) {
  let pdfParse;
  try {
    ({ default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js'));
  } catch {
    throw new AiError('UNSUPPORTED_FORMAT', 'PDF support is not installed on this server.', 422);
  }
  try {
    const data = await withTimeout(pdfParse(buffer, { max: MAX_PDF_PAGES }), EXTRACT_TIMEOUT_MS);
    return data.text || '';
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw new AiError(
      'EXTRACTION_FAILED',
      'Could not read this PDF (it may be encrypted or damaged).',
      422,
    );
  }
}

async function docxToText(buffer) {
  let mammoth;
  try {
    mammoth = (await import('mammoth')).default;
  } catch {
    throw new AiError('UNSUPPORTED_FORMAT', 'DOCX support is not installed on this server.', 422);
  }
  try {
    const { value } = await withTimeout(mammoth.extractRawText({ buffer }), EXTRACT_TIMEOUT_MS);
    return value || '';
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw new AiError('EXTRACTION_FAILED', 'Could not read this Word document.', 422);
  }
}

export async function extractText(buffer, ext) {
  const e = String(ext || '').toLowerCase();
  if (buffer.length > aiConfig.maxFileBytes) {
    throw new AiError('FILE_TOO_LARGE', 'This file is too large for AI analysis.', 422);
  }

  let raw;
  if (TEXT_EXT.has(e)) raw = decodeText(buffer);
  else if (HTML_EXT.has(e)) raw = htmlToText(decodeText(buffer));
  else if (PDF_EXT.has(e)) raw = await pdfToText(buffer);
  else if (DOCX_EXT.has(e)) raw = await docxToText(buffer);
  else {
    throw new AiError('UNSUPPORTED_FORMAT', 'This file type is not supported for AI analysis yet.', 422);
  }

  const text = normalize(raw);
  if (text.length < 20) {
    throw new AiError(
      'NO_TEXT',
      'No readable text was found (scanned documents need OCR, which is not supported yet).',
      422,
    );
  }
  return text;
}
