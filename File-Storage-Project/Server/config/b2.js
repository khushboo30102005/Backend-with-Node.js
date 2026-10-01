import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'eu-central-003',
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true, // safer default for non-AWS S3-compatible endpoints
});

export const BUCKET_NAME = process.env.B2_BUCKET_NAME;
export default s3;