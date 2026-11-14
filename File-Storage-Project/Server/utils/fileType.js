// File-type protection: extensions are derived and validated on the server,
// uploads are checked against their real content (magic bytes), and renames
// can never change a file's extension.
//
// Upload policy (unchanged in spirit — the app accepts any kind of file):
//   - A file whose extension names a format with a known signature (.pdf,
//     .png, .docx, .exe, ...) must actually contain that format.
//   - A file with a text extension (.txt, .csv, .json, ...) must not contain
//     binary content (a known binary signature, or NUL bytes).
//   - A file with any other extension must not be a disguised executable.
//   - A file without an extension is accepted as is.
// The client's Content-Type header is never trusted: the stored MIME type is
// derived from the validated extension.

// How many leading bytes are inspected (enough for every check below,
// including the tar header at offset 257).
export const SNIFF_BYTES = 4100;

// A "real" extension: a dot followed by 1-16 letters, digits, "_", "+" or "-".
// Anything else after the last dot ("notes.v2 final", "a.pdf ") is part of the
// name, not an extension.
const EXTENSION_PATTERN = /^\.[a-z0-9][a-z0-9_+-]{0,15}$/i;

// Trims surrounding whitespace and trailing dots/spaces, which Windows strips
// on save (so "doc.pdf." or "evil.exe " can't hide the real extension).
export function normalizeFileName(name) {
  return String(name ?? '')
    .trim()
    .replace(/[.\s]+$/, '');
}

// The extension of a (normalized) file name, lower case, or '' when it has none.
export function getExtension(name) {
  const base = String(name).split(/[/\\]/).pop();
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return ''; // no dot, or a dotfile such as ".env"
  const ext = base.slice(dot);
  return EXTENSION_PATTERN.test(ext) ? ext.toLowerCase() : '';
}

// ------------------------------------------------------------ signatures

const startsWith = (buf, bytes, offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));
const hasAscii = (buf, s, offset = 0) => startsWith(buf, ascii(s), offset);

const isZip = (b) =>
  startsWith(b, [0x50, 0x4b, 0x03, 0x04]) ||
  startsWith(b, [0x50, 0x4b, 0x05, 0x06]) || // empty archive
  startsWith(b, [0x50, 0x4b, 0x07, 0x08]); // spanned archive
const isOle = (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const isRiff = (b, form) => hasAscii(b, 'RIFF') && hasAscii(b, form, 8);
// ISO base media (MP4, MOV, M4A, HEIC, AVIF, 3GP): a box size, then "ftyp".
const isIsoMedia = (b) => b.length >= 12 && b[0] === 0 && hasAscii(b, 'ftyp', 4);
// Older QuickTime/MP4 files may start with another top-level box.
const isQuickTime = (b) =>
  isIsoMedia(b) || ['moov', 'mdat', 'wide', 'free', 'skip', 'pnot'].some((t) => hasAscii(b, t, 4));
const isPdf = (b) => b.subarray(0, 1024).includes(Buffer.from('%PDF-'));
const isJpeg = (b) => startsWith(b, [0xff, 0xd8, 0xff]);
const isPng = (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isGif = (b) => hasAscii(b, 'GIF87a') || hasAscii(b, 'GIF89a');
const isTiff = (b) => startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a]);
const isIco = (b) => startsWith(b, [0x00, 0x00, 0x01, 0x00]);
const isCur = (b) => startsWith(b, [0x00, 0x00, 0x02, 0x00]);
const isMp3 = (b) =>
  (hasAscii(b, 'ID3') && b.length > 3 && b[3] >= 2 && b[3] <= 4) ||
  (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0);
const isAac = (b) => b.length >= 2 && b[0] === 0xff && (b[1] & 0xf6) === 0xf0;
const isEbml = (b) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]); // WebM / Matroska
const isOgg = (b) => hasAscii(b, 'OggS');
const isGzip = (b) => startsWith(b, [0x1f, 0x8b]);
const isBzip2 = (b) => hasAscii(b, 'BZh') && b[3] >= 0x31 && b[3] <= 0x39;
const isXz = (b) => startsWith(b, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]);
const isZstd = (b) => startsWith(b, [0x28, 0xb5, 0x2f, 0xfd]);
const isRar = (b) => startsWith(b, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]);
const is7z = (b) => startsWith(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
const isTar = (b) => hasAscii(b, 'ustar', 257);
const isSqlite = (b) => hasAscii(b, 'SQLite format 3\0');
const isWasm = (b) => startsWith(b, [0x00, 0x61, 0x73, 0x6d]);
const isClass = (b) => startsWith(b, [0xca, 0xfe, 0xba, 0xbe]);
// Windows PE / DOS executable: "MZ" and a binary DOS header (text has no NULs).
const isPe = (b) => hasAscii(b, 'MZ') && b.length >= 64 && b.subarray(0, 64).includes(0);
const isElf = (b) => startsWith(b, [0x7f, 0x45, 0x4c, 0x46]);
const isMachO = (b) =>
  [
    [0xfe, 0xed, 0xfa, 0xce],
    [0xfe, 0xed, 0xfa, 0xcf],
    [0xce, 0xfa, 0xed, 0xfe],
    [0xcf, 0xfa, 0xed, 0xfe],
  ].some((sig) => startsWith(b, sig));
const isExecutable = (b) => isPe(b) || isElf(b) || isMachO(b);
const isTtf = (b) => startsWith(b, [0x00, 0x01, 0x00, 0x00]) || hasAscii(b, 'true');

// Extension -> check its content must pass.
const SIGNATURES = {
  // images
  '.png': isPng,
  '.jpg': isJpeg,
  '.jpeg': isJpeg,
  '.jpe': isJpeg,
  '.jfif': isJpeg,
  '.gif': isGif,
  '.webp': (b) => isRiff(b, 'WEBP'),
  '.bmp': (b) => hasAscii(b, 'BM'),
  '.ico': (b) => isIco(b) || isPng(b),
  '.cur': isCur,
  '.tif': isTiff,
  '.tiff': isTiff,
  '.heic': isIsoMedia,
  '.heif': isIsoMedia,
  '.avif': isIsoMedia,
  '.psd': (b) => hasAscii(b, '8BPS'),
  // documents
  '.pdf': isPdf,
  '.rtf': (b) => hasAscii(b, '{\\rtf'),
  '.docx': isZip, '.xlsx': isZip, '.pptx': isZip,
  '.docm': isZip, '.xlsm': isZip, '.pptm': isZip,
  '.dotx': isZip, '.xltx': isZip, '.potx': isZip, '.ppsx': isZip,
  '.odt': isZip, '.ods': isZip, '.odp': isZip, '.odg': isZip,
  '.epub': isZip,
  '.doc': isOle, '.xls': isOle, '.ppt': isOle, '.dot': isOle, '.xlt': isOle,
  '.pot': isOle, '.pps': isOle, '.msg': isOle, '.msi': isOle, '.pub': isOle, '.vsd': isOle,
  // audio / video
  '.mp3': isMp3,
  '.aac': isAac,
  '.wav': (b) => isRiff(b, 'WAVE'),
  '.avi': (b) => isRiff(b, 'AVI '),
  '.flac': (b) => hasAscii(b, 'fLaC'),
  '.ogg': isOgg, '.oga': isOgg, '.ogv': isOgg, '.opus': isOgg,
  '.mid': (b) => hasAscii(b, 'MThd'),
  '.midi': (b) => hasAscii(b, 'MThd'),
  '.mp4': isQuickTime, '.m4v': isQuickTime, '.m4a': isQuickTime, '.mov': isQuickTime,
  '.3gp': isIsoMedia, '.3g2': isIsoMedia,
  '.webm': isEbml, '.mkv': isEbml, '.mka': isEbml,
  // archives
  '.zip': isZip, '.jar': isZip, '.apk': isZip, '.aab': isZip, '.xpi': isZip, '.cbz': isZip,
  '.ipa': isZip, '.whl': isZip, '.nupkg': isZip, '.vsix': isZip, '.kmz': isZip,
  '.gz': isGzip, '.tgz': isGzip,
  '.bz2': isBzip2, '.tbz2': isBzip2,
  '.xz': isXz, '.txz': isXz,
  '.zst': isZstd,
  '.rar': isRar,
  '.7z': is7z,
  '.tar': isTar,
  // other binary formats
  '.sqlite': isSqlite, '.sqlite3': isSqlite,
  '.wasm': isWasm,
  '.class': isClass,
  '.woff': (b) => hasAscii(b, 'wOFF'),
  '.woff2': (b) => hasAscii(b, 'wOF2'),
  '.ttf': isTtf,
  '.otf': (b) => hasAscii(b, 'OTTO'),
  // executables
  '.exe': isPe, '.dll': isPe, '.sys': isPe, '.scr': isPe, '.ocx': isPe,
  '.cpl': isPe, '.drv': isPe, '.efi': isPe,
  '.so': isElf, '.ko': isElf,
  '.dylib': isMachO,
};

// Extensions whose content must be text.
const TEXT_EXTENSIONS = new Set(
  (
    'txt text md markdown csv tsv json jsonl log xml yml yaml toml ini cfg conf env ' +
    'html htm css scss sass less js mjs cjs jsx ts tsx vue svelte py rb php java kt ' +
    'c h cpp hpp cc cs go rs swift sh bash zsh bat cmd ps1 sql graphql svg srt vtt ' +
    'tex ics vcf properties gitignore dockerfile'
  )
    .split(' ')
    .map((e) => `.${e}`),
);

// Extensions that may legitimately hold an executable without a fixed
// signature check above (.bin, .o, Node add-ons, ...).
const EXECUTABLE_EXTENSIONS = new Set(
  ['.bin', '.out', '.o', '.elf', '.node', '.com', '.run', '.app', '.bundle', '.axf', '.prx', '.pyd', '.xll'],
);

// Binary formats a text file must not be (only strong signatures, so text
// that happens to start with e.g. "BM" or "MZ" isn't misdetected).
const BINARY_CHECKS = [
  isPng, isJpeg, isGif, (b) => hasAscii(b, '%PDF-'), isZip, isOle, isGzip, isXz, isZstd, isRar, is7z,
  isSqlite, isWasm, isClass, isExecutable, isTiff, isIco, isEbml, isOgg,
  isIsoMedia, (b) => isRiff(b, 'WEBP') || isRiff(b, 'WAVE') || isRiff(b, 'AVI '),
];

const hasUnicodeBom = (b) =>
  startsWith(b, [0xff, 0xfe]) || startsWith(b, [0xfe, 0xff]); // UTF-16/32 LE/BE

const looksLikeText = (b) =>
  !BINARY_CHECKS.some((check) => check(b)) && (hasUnicodeBom(b) || !b.includes(0));

// Throws FileTypeError when `sample` (the first SNIFF_BYTES of the file, or
// the whole file if shorter) doesn't fit the policy for `extension`.
export class FileTypeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FileTypeError';
    this.status = 415;
    this.code = 'FILE_TYPE_MISMATCH';
  }
}

export function validateFileContent(extension, sample) {
  if (!sample?.length) return; // empty file: no content to mismatch
  const ext = String(extension).toLowerCase();

  const signature = SIGNATURES[ext];
  if (signature) {
    if (!signature(sample)) {
      throw new FileTypeError(`The file's content does not match its ${ext} extension.`);
    }
    return;
  }
  if (TEXT_EXTENSIONS.has(ext)) {
    if (!looksLikeText(sample)) {
      throw new FileTypeError(`The file's content does not match its ${ext} extension.`);
    }
    return;
  }
  if (ext && !EXECUTABLE_EXTENSIONS.has(ext) && isExecutable(sample)) {
    throw new FileTypeError('Executable files must use an executable file extension.');
  }
}

// ------------------------------------------------------------ MIME types

const TEXT = 'text/plain; charset=utf-8';
const MIME_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jpe': 'image/jpeg',
  '.jfif': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.ico': 'image/x-icon', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.heic': 'image/heic',
  '.heif': 'image/heif', '.avif': 'image/avif', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.rtf': 'application/rtf',
  '.doc': 'application/msword', '.xls': 'application/vnd.ms-excel',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.epub': 'application/epub+zip',
  '.mp3': 'audio/mpeg', '.aac': 'audio/aac', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.m4a': 'audio/mp4',
  '.mid': 'audio/midi', '.midi': 'audio/midi',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo', '.ogv': 'video/ogg',
  '.3gp': 'video/3gpp', '.3g2': 'video/3gpp2',
  '.zip': 'application/zip', '.gz': 'application/gzip', '.tgz': 'application/gzip',
  '.rar': 'application/vnd.rar', '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar', '.bz2': 'application/x-bzip2', '.xz': 'application/x-xz',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.json': 'application/json', '.csv': 'text/csv; charset=utf-8',
};

// The Content-Type an object is stored with. Text formats — including HTML
// and scripts — are stored as plain text so they can never run as a page.
export function mimeTypeFor(extension) {
  const ext = String(extension).toLowerCase();
  if (MIME_TYPES[ext]) return MIME_TYPES[ext];
  if (TEXT_EXTENSIONS.has(ext)) return TEXT;
  return 'application/octet-stream';
}

// ------------------------------------------------------------ renames

// Returns { name } — the new name with the file's original extension kept
// exactly as stored — or { error } when the rename would change, add or
// remove the extension. Older records may hold an extension the current
// rules wouldn't produce, so the stored value is what's compared.
export function resolveRename(newName, storedExtension) {
  if (typeof newName !== 'string') return { error: 'Please enter a valid file name.' };
  const name = normalizeFileName(newName);
  if (!name) return { error: 'File name cannot be empty.' };
  if (name.length > 255) return { error: 'File name cannot exceed 255 characters.' };

  const stored = String(storedExtension ?? '');
  if (stored) {
    const keepsExtension =
      name.length > stored.length && name.toLowerCase().endsWith(stored.toLowerCase());
    if (!keepsExtension) {
      return { error: `The file extension (${stored}) cannot be changed.` };
    }
    const base = normalizeFileName(name.slice(0, -stored.length));
    if (!base) return { error: 'File name cannot be empty.' };
    return { name: `${base}${stored}` };
  }
  if (getExtension(name)) {
    return { error: 'This file has no extension, and one cannot be added.' };
  }
  return { name };
}

// ------------------------------------------------------------ streaming

// Collects the first SNIFF_BYTES of a stream of chunks. push() returns the
// buffered chunks to forward once enough bytes arrived (or [] while still
// buffering); finish() returns whatever is left at the end of the stream.
// The content is validated exactly once, before any byte is forwarded.
export function createSniffer(extension) {
  let pending = [];
  let length = 0;
  let checked = false;
  const check = () => {
    checked = true;
    validateFileContent(extension, Buffer.concat(pending).subarray(0, SNIFF_BYTES));
    const out = pending;
    pending = [];
    return out;
  };
  return {
    push(chunk) {
      if (checked) return [chunk];
      pending.push(chunk);
      length += chunk.length;
      return length >= SNIFF_BYTES ? check() : [];
    },
    finish() {
      return checked ? [] : check();
    },
  };
}
