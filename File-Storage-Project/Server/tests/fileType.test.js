// Unit tests for utils/fileType.js: extension rules, magic-byte validation,
// MIME derivation and rename resolution. (The upload and rename routes are
// covered end to end in storage.test.js.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FileTypeError,
  SNIFF_BYTES,
  createSniffer,
  getExtension,
  mimeTypeFor,
  normalizeFileName,
  resolveRename,
  validateFileContent,
} from '../utils/fileType.js';

const buf = (head, n = 128, fill = 0x20) =>
  Buffer.concat([Buffer.from(head), Buffer.alloc(Math.max(0, n - head.length), fill)]);
const SAMPLES = {
  png: buf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpeg: buf([0xff, 0xd8, 0xff, 0xdb]),
  gif: buf('GIF89a'),
  webp: buf([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')]),
  wav: buf([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WAVE')]),
  pdf: buf('%PDF-1.4\n'),
  zip: buf([0x50, 0x4b, 0x03, 0x04]),
  ole: buf([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  mp4: buf([0, 0, 0, 0x20, ...Buffer.from('ftypisom')]),
  webm: buf([0x1a, 0x45, 0xdf, 0xa3]),
  mp3: buf('ID3\x03'),
  gzip: buf([0x1f, 0x8b, 0x08]),
  exe: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(126)]),
  elf: buf([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0]),
  text: Buffer.from('Hello, world!\nSecond line.\n'),
};

const accepts = (ext, sample) => assert.doesNotThrow(() => validateFileContent(ext, sample), `${ext} should accept`);
const rejects = (ext, sample) =>
  assert.throws(() => validateFileContent(ext, sample), FileTypeError, `${ext} should reject`);

test('getExtension: lower-cased, only real extensions count', () => {
  assert.equal(getExtension('report.PDF'), '.pdf');
  assert.equal(getExtension('archive.tar.gz'), '.gz');
  assert.equal(getExtension('README'), '');
  assert.equal(getExtension('.env'), ''); // dotfile, not an extension
  assert.equal(getExtension('notes.v2 final'), ''); // contains a space
  assert.equal(getExtension('dir/name.txt'), '.txt');
});

test('normalizeFileName: trailing dots and spaces cannot hide an extension', () => {
  assert.equal(normalizeFileName('  doc.pdf.  '), 'doc.pdf');
  assert.equal(normalizeFileName('evil.exe '), 'evil.exe');
  assert.equal(normalizeFileName(undefined), '');
});

test('validateFileContent: matching signatures are accepted', () => {
  accepts('.png', SAMPLES.png);
  accepts('.jpg', SAMPLES.jpeg);
  accepts('.jpeg', SAMPLES.jpeg);
  accepts('.gif', SAMPLES.gif);
  accepts('.webp', SAMPLES.webp);
  accepts('.wav', SAMPLES.wav);
  accepts('.pdf', SAMPLES.pdf);
  accepts('.docx', SAMPLES.zip);
  accepts('.xlsx', SAMPLES.zip);
  accepts('.zip', SAMPLES.zip);
  accepts('.doc', SAMPLES.ole);
  accepts('.mp4', SAMPLES.mp4);
  accepts('.mov', SAMPLES.mp4);
  accepts('.webm', SAMPLES.webm);
  accepts('.mp3', SAMPLES.mp3);
  accepts('.gz', SAMPLES.gzip);
  accepts('.exe', SAMPLES.exe);
  accepts('.so', SAMPLES.elf);
});

test('validateFileContent: mismatched signatures are rejected', () => {
  rejects('.pdf', SAMPLES.exe);
  rejects('.png', SAMPLES.jpeg);
  rejects('.jpg', SAMPLES.png);
  rejects('.docx', SAMPLES.pdf);
  rejects('.doc', SAMPLES.zip);
  rejects('.mp4', SAMPLES.text);
  rejects('.webp', SAMPLES.wav); // same RIFF container, different form
  rejects('.exe', SAMPLES.pdf);
  rejects('.zip', SAMPLES.text);
});

test('validateFileContent: text extensions must hold text', () => {
  accepts('.txt', SAMPLES.text);
  accepts('.csv', Buffer.from('a,b\n1,2\n'));
  accepts('.json', Buffer.from('{"ok":true}'));
  accepts('.md', Buffer.from('MZ is how this note starts')); // "MZ" alone isn't an executable
  accepts('.txt', Buffer.from('Notes about the %PDF-1.7 header')); // mentions PDF, isn't one
  accepts('.txt', Buffer.from([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00])); // UTF-16LE with BOM
  rejects('.txt', SAMPLES.exe);
  rejects('.txt', SAMPLES.png);
  rejects('.csv', SAMPLES.zip);
  rejects('.html', SAMPLES.elf);
  rejects('.json', Buffer.from([0x7b, 0x00, 0x7d])); // NUL bytes
});

test('validateFileContent: other extensions only refuse disguised executables', () => {
  accepts('.custom', SAMPLES.png); // unknown formats stay allowed, as before
  accepts('.dat', Buffer.alloc(64, 7));
  accepts('.bin', SAMPLES.exe); // a legitimate executable container
  accepts('', SAMPLES.exe); // no extension, nothing to disguise
  rejects('.dat', SAMPLES.exe);
  rejects('.custom', SAMPLES.elf);
});

test('validateFileContent: an empty file has nothing to mismatch', () => {
  accepts('.pdf', Buffer.alloc(0));
});

test('mimeTypeFor: derived from the extension, text never served as a page', () => {
  assert.equal(mimeTypeFor('.png'), 'image/png');
  assert.equal(mimeTypeFor('.PDF'), 'application/pdf');
  assert.equal(mimeTypeFor('.mp4'), 'video/mp4');
  assert.equal(mimeTypeFor('.html'), 'text/plain; charset=utf-8');
  assert.equal(mimeTypeFor('.js'), 'text/plain; charset=utf-8');
  assert.equal(mimeTypeFor('.exe'), 'application/octet-stream');
  assert.equal(mimeTypeFor(''), 'application/octet-stream');
});

test('resolveRename: keeps the stored extension, rejects any change to it', () => {
  assert.deepEqual(resolveRename('Summary.pdf', '.pdf'), { name: 'Summary.pdf' });
  assert.deepEqual(resolveRename('Summary.PDF', '.pdf'), { name: 'Summary.pdf' });
  assert.deepEqual(resolveRename('a.exe.pdf', '.pdf'), { name: 'a.exe.pdf' });
  assert.deepEqual(resolveRename('legacy.PDF', '.PDF'), { name: 'legacy.PDF' }); // older record casing
  assert.deepEqual(resolveRename('COPYING', ''), { name: 'COPYING' });
  assert.deepEqual(resolveRename('notes.v3 final', ''), { name: 'notes.v3 final' });

  for (const [name, ext] of [
    ['Summary.exe', '.pdf'],
    ['Summary', '.pdf'],
    ['Summary.pdf.exe', '.pdf'],
    ['.pdf', '.pdf'],
    ['COPYING.exe', ''],
    ['', '.pdf'],
    ['   ', ''],
    [123, '.pdf'],
    ['x'.repeat(256), ''],
  ]) {
    assert.ok(resolveRename(name, ext).error, `${JSON.stringify(name)} with ${ext || 'no extension'}`);
  }
});

test('createSniffer: validates once, before forwarding, and forwards every byte in order', () => {
  const data = Buffer.concat([SAMPLES.pdf, Buffer.alloc(SNIFF_BYTES * 2, 1)]);
  const sniffer = createSniffer('.pdf');
  const out = [];
  for (let i = 0; i < data.length; i += 1000) out.push(...sniffer.push(data.subarray(i, i + 1000)));
  out.push(...sniffer.finish());
  assert.deepEqual(Buffer.concat(out), data);

  const small = createSniffer('.pdf');
  assert.deepEqual(small.push(SAMPLES.pdf.subarray(0, 3)), [], 'held back until checked');
  assert.deepEqual(Buffer.concat([...small.push(SAMPLES.pdf.subarray(3)), ...small.finish()]), SAMPLES.pdf);

  const bad = createSniffer('.pdf');
  assert.deepEqual(bad.push(SAMPLES.exe.subarray(0, 10)), [], 'nothing forwarded yet');
  assert.throws(() => bad.push(Buffer.alloc(SNIFF_BYTES)), FileTypeError);
});
