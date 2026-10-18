import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3, { BUCKET_NAME } from '../config/b2.js'; // the existing B2 client

// What the `picture` field can hold:
//   - "https://..."        a Google (or default placeholder) URL, used as is
//   - "avatars/<id>/<uuid>.webp"   the B2 object key of an uploaded avatar
export const AVATAR_PREFIX = 'avatars/';
export const AVATAR_MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB before processing
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AVATAR_SIZE = 256;
const MAX_INPUT_PIXELS = 50_000_000; // guards against decompression bombs
const SIGNED_URL_TTL = 7 * 24 * 60 * 60; // B2's maximum presign lifetime

export class AvatarError extends Error {}

export const isStoredAvatar = (picture) =>
  typeof picture === 'string' && picture.startsWith(AVATAR_PREFIX);

// Never trusts the client's Content-Type: the real format is detected from
// the bytes, then the image is auto-rotated, center-cropped to a square,
// resized and re-encoded. Re-encoding also strips EXIF/GPS metadata.
export async function processAvatar(buffer) {
  let format;
  try {
    ({ format } = await sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata());
  } catch {
    throw new AvatarError('That file is not a valid image.');
  }
  if (!['jpeg', 'png', 'webp'].includes(format)) {
    throw new AvatarError('Only JPEG, PNG or WebP images are allowed.');
  }
  try {
    return await sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: 'error',
    })
      .rotate() // honour EXIF orientation before the metadata is dropped
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new AvatarError('That image could not be processed.');
  }
}

// A fresh key for every upload, so the old image can be deleted and browsers
// never show a stale cached one.
export async function uploadAvatar(userId, buffer) {
  const key = `${AVATAR_PREFIX}${userId}/${randomUUID()}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return key;
}

// Best effort: a leftover object is harmless, so this never throws.
export async function deleteAvatar(key) {
  if (!isStoredAvatar(key)) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch (err) {
    console.log('Could not delete avatar from B2:', err.message);
  }
}

// The bucket is private, so a stored key is turned into a presigned URL when
// a response is built. The URL is signed at midnight UTC, which keeps it
// identical all day (so browsers can cache it) and valid for 6-7 days.
const urlCache = new Map();

export async function resolvePicture(picture) {
  if (!isStoredAvatar(picture)) return picture; // Google / placeholder URL
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const cacheKey = `${day.getTime()}:${picture}`;
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: picture }),
    { expiresIn: SIGNED_URL_TTL, signingDate: day },
  );
  if (urlCache.size > 2000) urlCache.clear();
  urlCache.set(cacheKey, url);
  return url;
}