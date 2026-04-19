require('dotenv').config();
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function getSignedURL(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  });

  const url = await getSignedUrl(s3Client, command); 
  return url;
}


async function putObject(filename, contentType) {
    const key = `uploads/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read'  // 👈 makes uploaded image public
  });

  // Generate signed URL for uploading
  const uploadUrl = await getSignedUrl(s3Client, command);
  const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  // Return both upload URL (for React PUT) and final public URL
  return { uploadUrl, publicUrl };
}

module.exports = { getSignedURL, putObject };
