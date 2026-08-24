import { Handler } from '@netlify/functions';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const handler: Handler = async (event) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { filename, contentType } = JSON.parse(event.body || '{}');

    if (!filename) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Filename is required' }) };
    }

    // Sanitize filename: remove directory paths and special characters
    const sanitizedFilename = filename.replace(/^.*[\\/]/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: sanitizedFilename,
      ContentType: contentType || 'application/json',
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.R2_PUBLIC_DEV_URL || ''}/${sanitizedFilename}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl: signedUrl,
        fileUrl: publicUrl,
        key: filename
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
