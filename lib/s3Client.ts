import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadToS3(file: File, key: string) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: file.type,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    // Return the public URL
    return `https://${params.Bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

export default s3Client;
