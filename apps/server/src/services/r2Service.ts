import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class R2Service {
  private client: S3Client | null = null;
  private bucketName: string;
  private isConfigured: boolean = false;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "csv-management";

    // In test environment, always simulate storage to avoid real network calls
    const isTestEnv = process.env.NODE_ENV === "test";

    if (!isTestEnv && accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
    } else {
      this.client = null;
      this.isConfigured = false;
      if (!isTestEnv) {
        console.warn(
          "Cloudflare R2 credentials not configured. File storage will be simulated."
        );
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    type: "strings" | "classifications"
  ): Promise<string> {
    const timestamp = Date.now();
    const key = `uploads/${type}/${timestamp}-${file.originalname}`;

    if (!this.isConfigured || !this.client) {
      console.log(`Simulating upload: ${key}`);
      return key;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        type,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.client.send(command);
    return key;
  }

  async uploadGeneratedFile(buffer: Buffer, filename: string): Promise<string> {
    const timestamp = Date.now();
    const key = `exports/${timestamp}-${filename}`;

    if (!this.isConfigured || !this.client) {
      console.log(`Simulating generated file upload: ${key}`);
      return `data:text/csv;base64,${buffer.toString("base64")}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "text/csv",
      Metadata: {
        generatedAt: new Date().toISOString(),
      },
    });

    await this.client.send(command);

    const downloadCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.client, downloadCommand, {
      expiresIn: 3600,
    });
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isConfigured || !this.client) {
      console.log(`Simulating get file URL: ${key}`);
      return `#simulated-url-${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.isConfigured || !this.client) {
      console.log(`Simulating delete file: ${key}`);
      return;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }
}

export const r2Service = new R2Service();
