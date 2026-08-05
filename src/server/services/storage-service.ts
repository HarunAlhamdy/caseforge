export interface UploadUrlRequest {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface StorageProvider {
  getUploadUrl(request: UploadUrlRequest): Promise<string>;
  getPublicUrl(key: string): string;
  deleteObject(key: string): Promise<void>;
}

export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private endpoint: string;

  constructor(
    bucket = process.env.S3_BUCKET ?? "caseforge",
    endpoint = process.env.S3_ENDPOINT ?? "",
  ) {
    this.bucket = bucket;
    this.endpoint = endpoint;
  }

  async getUploadUrl(request: UploadUrlRequest): Promise<string> {
    if (!process.env.S3_ACCESS_KEY_ID) {
      return `https://storage.local/${this.bucket}/${request.key}?stub=true`;
    }

    // Full presigned URL support in Prompt 12+
    return `${this.endpoint}/${this.bucket}/${request.key}?upload=true&expires=${request.expiresInSeconds ?? 3600}`;
  }

  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    void key;
  }
}

export function createStorageService(): StorageProvider {
  return new S3StorageProvider();
}
