// Storage utility - AWS S3 only
// All file storage operations go through AWS S3

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined, // Falls back to AWS CLI/instance credentials
  });
}

function getBucket() {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }
  return bucket;
}

/**
 * Upload a file to S3
 * @param file File buffer or Blob
 * @param filename Desired filename (will be made unique)
 * @param folder Optional folder path (e.g., 'resumes', 'exports')
 * @returns URL of uploaded file
 */
export async function uploadFile(
  file: Buffer | Blob,
  filename: string,
  folder: string = 'resumes'
): Promise<string> {
  const s3Client = getS3Client();
  const bucket = getBucket();

  const timestamp = Date.now();
  const key = `${folder}/${timestamp}-${filename}`;

  const fileBuffer =
    file instanceof Buffer
      ? file
      : Buffer.from(await (file as Blob).arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: getContentType(filename),
  });

  await s3Client.send(command);

  return `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 * @param fileUrl Full URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const s3Client = getS3Client();
  const bucket = getBucket();
  const key = extractS3Key(fileUrl);

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get a signed URL for temporary access to a private file
 * @param fileUrl File URL or path
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  const s3Client = getS3Client();
  const bucket = getBucket();
  const key = extractS3Key(fileUrl);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return awsGetSignedUrl(s3Client, command, { expiresIn });
}

function extractS3Key(url: string): string {
  const match = url.match(/amazonaws\.com\/(.+)$/);
  return match ? match[1] : url;
}

function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Check storage configuration status
 */
export function getStorageStatus() {
  try {
    getBucket();
    return {
      configured: true,
      provider: 's3' as const,
      details: {
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET_NAME,
      },
    };
  } catch (error) {
    return {
      configured: false,
      provider: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
