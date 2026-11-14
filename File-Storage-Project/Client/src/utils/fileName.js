// Mirrors the server's rules (Server/utils/fileType.js): a file's extension is
// fixed at upload, so rename dialogs only edit the part before it.
const EXTENSION_PATTERN = /^\.[a-z0-9][a-z0-9_+-]{0,15}$/i;

function deriveExtension(name) {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return '';
  const ext = name.slice(dot);
  return EXTENSION_PATTERN.test(ext) ? ext : '';
}

// Splits a file name into { base, ext }. `extension` is the stored extension
// when the caller has it (preferred); otherwise it's derived from the name.
export function splitFileName(name, extension) {
  const full = String(name ?? '');
  const ext = typeof extension === 'string' ? extension : deriveExtension(full);
  if (ext && full.length > ext.length && full.toLowerCase().endsWith(ext.toLowerCase())) {
    return { base: full.slice(0, -ext.length), ext: full.slice(-ext.length) };
  }
  return { base: full, ext: '' };
}
