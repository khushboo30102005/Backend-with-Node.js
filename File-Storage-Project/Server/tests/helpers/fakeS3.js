// In-memory stand-in for the B2 (S3) client and @aws-sdk/lib-storage's Upload.
// Objects live in a Map; nothing is sent over the network.
export function createFakeS3() {
  const objects = new Map(); // key -> Buffer
  const contentTypes = new Map(); // key -> ContentType the object was stored with
  const s3 = {
    objects,
    contentTypes,
    uploadDelayMs: 0, // hold every upload open this long after the body ends
    failUploadsAfterBytes: null, // simulate B2 failing mid-upload
    failCopy: false,
    failDeletes: 0, // the next N delete commands throw (simulated B2 outage)
    failDeleteWhen: null, // optional (keys) => bool: only matching deletes fail
    reset() {
      objects.clear();
      contentTypes.clear();
      s3.uploadDelayMs = 0;
      s3.failUploadsAfterBytes = null;
      s3.failCopy = false;
      s3.failDeletes = 0;
      s3.failDeleteWhen = null;
    },
    async send(cmd) {
      const name = cmd.constructor.name;
      const input = cmd.input;
      const deleteKeys =
        name === 'DeleteObjectsCommand'
          ? input.Delete.Objects.map((o) => o.Key)
          : [input.Key];
      if (
        name.startsWith('DeleteObject') &&
        s3.failDeletes > 0 &&
        (!s3.failDeleteWhen || s3.failDeleteWhen(deleteKeys))
      ) {
        s3.failDeletes -= 1;
        throw new Error('B2 delete failed (injected)');
      }
      switch (name) {
        case 'ListObjectsV2Command': {
          const keys = [...objects.keys()].filter((k) => k.startsWith(input.Prefix || ''));
          return { Contents: keys.map((Key) => ({ Key })), IsTruncated: false };
        }
        case 'DeleteObjectCommand':
          objects.delete(input.Key);
          return {};
        case 'DeleteObjectsCommand':
          for (const o of input.Delete.Objects) objects.delete(o.Key);
          return {};
        case 'CopyObjectCommand': {
          if (s3.failCopy) throw new Error('B2 copy failed (injected)');
          const srcKey = decodeURIComponent(input.CopySource.split('/').slice(1).join('/'));
          if (!objects.has(srcKey)) throw Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey' });
          objects.set(input.Key, Buffer.from(objects.get(srcKey)));
          return {};
        }
        default:
          throw new Error(`fakeS3: unsupported command ${name}`);
      }
    },
  };

  class Upload {
    constructor({ params }) {
      this.params = params;
      this.aborted = false;
    }
    async done() {
      const chunks = [];
      let n = 0;
      for await (const chunk of this.params.Body) {
        if (this.aborted) throw new Error('upload aborted');
        n += chunk.length;
        if (s3.failUploadsAfterBytes !== null && n > s3.failUploadsAfterBytes) {
          throw new Error('B2 upload failed (injected)');
        }
        chunks.push(chunk);
      }
      if (s3.uploadDelayMs) await new Promise((r) => setTimeout(r, s3.uploadDelayMs));
      if (this.aborted) throw new Error('upload aborted');
      objects.set(this.params.Key, Buffer.concat(chunks));
      contentTypes.set(this.params.Key, this.params.ContentType);
      return { Key: this.params.Key };
    }
    async abort() {
      this.aborted = true;
      this.params.Body.destroy?.();
    }
  }

  return { s3, Upload };
}
