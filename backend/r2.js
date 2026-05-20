/**
 * Cloudflare R2 storage (S3-compatible API).
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicBaseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

/** S3 client pointed at R2 endpoint. */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Build public URL for an object key.
 * @param {string} key - Object path in bucket
 */
export function getPublicUrl(key) {
  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_URL is not configured');
  }
  return `${publicBaseUrl}/${key.replace(/^\//, '')}`;
}

/**
 * Upload a file buffer to R2.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {{ key: string, url: string, file_url: string }}
 */
export async function uploadFile(buffer, originalName, mimeType) {
  if (!bucketName || !accountId) {
    throw new Error('R2 is not configured (missing R2_ACCOUNT_ID or R2_BUCKET_NAME)');
  }

  const ext = path.extname(originalName || '') || '';
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
    })
  );

  const url = getPublicUrl(key);
  return { key, url, file_url: url };
}
