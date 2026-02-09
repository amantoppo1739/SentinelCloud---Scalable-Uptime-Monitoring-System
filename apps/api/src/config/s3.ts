import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

export const s3Client =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME
    ? new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

export const S3_BUCKET = env.S3_BUCKET_NAME ?? null;
