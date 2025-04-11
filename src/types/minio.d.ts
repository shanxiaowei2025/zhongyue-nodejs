declare module 'minio' {
  export class Client {
    constructor(config: {
      endPoint: string;
      port: number;
      useSSL: boolean;
      accessKey: string;
      secretKey: string;
    });

    bucketExists(bucketName: string): Promise<boolean>;
    makeBucket(bucketName: string): Promise<void>;
    putObject(
      bucketName: string,
      objectName: string,
      stream: Buffer,
      size: number,
    ): Promise<void>;
    presignedGetObject(
      bucketName: string,
      objectName: string,
      expires?: number,
    ): Promise<string>;
    removeObject(bucketName: string, objectName: string): Promise<void>;
    listObjects(bucketName: string, prefix?: string, recursive?: boolean): any;
  }
}
