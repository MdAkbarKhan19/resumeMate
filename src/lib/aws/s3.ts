import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig, s3Config } from '@/config';

const s3Client = new S3Client(awsConfig);

export class S3Service {
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    file: Buffer,
    key: string,
    contentType: string
  ): Promise<{ url: string; key: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await s3Client.send(command);

      const url = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
      
      return { url, key };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Get a pre-signed URL for secure file download
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('S3 get signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate a unique S3 key for a file
   */
  static generateKey(userId: string, fileName: string, folder: string = 'resumes'): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${folder}/${userId}/${timestamp}-${randomStr}-${sanitizedFileName}`;
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File | Buffer, mimeType: string): { valid: boolean; error?: string } {
    // Check mime type
    if (!s3Config.allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `File type ${mimeType} is not allowed. Allowed types: ${s3Config.allowedMimeTypes.join(', ')}`,
      };
    }

    // Check file size
    const size = file instanceof File ? file.size : file.length;
    if (size > s3Config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${s3Config.maxFileSize / (1024 * 1024)}MB`,
      };
    }

    return { valid: true };
  }
}

export default S3Service;
