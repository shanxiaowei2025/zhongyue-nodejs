import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);
  private initialized = false;
  private initializationAttempted = false;
  private forceBypassInitCheck = true; // 强制绕过初始化检查

  constructor(private configService: ConfigService) {
    const minioConfig = this.configService.get('minio');

    if (!minioConfig) {
      this.logger.error('MinIO配置未找到，请检查configuration');
      return;
    }

    this.logger.log(
      `正在初始化MinIO客户端: ${minioConfig.endPoint}:${minioConfig.port}, SSL: ${minioConfig.useSSL}`,
    );
    this.logger.log(
      `AccessKey: ${minioConfig.accessKey.substring(0, 4)}***, BucketName: ${minioConfig.bucketName}`,
    );

    // 创建配置选项
    const minioOptions: any = {
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
      pathStyle: minioConfig.pathStyle,
    };

    // 处理HTTPS选项，但不设置transport
    if (minioConfig.useSSL) {
      this.logger.log('使用HTTPS连接，禁用SSL证书验证');
      // 仅通过环境变量禁用证书验证
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    } else {
      this.logger.log('使用HTTP连接');
    }

    // 创建MinIO客户端
    this.minioClient = new Minio.Client(minioOptions);
    this.bucketName = minioConfig.bucketName;

    // 测试连接有效性
    this.testConnection();
  }

  private async testConnection() {
    // 使用低级HTTP/HTTPS请求测试连接
    const minioConfig = this.configService.get('minio');
    if (!minioConfig) return;

    this.logger.log(
      `正在测试连接到 ${minioConfig.endPoint}:${minioConfig.port}`,
    );

    try {
      // 根据useSSL选择对应的模块
      const requestModule = minioConfig.useSSL ? https : http;
      this.logger.log(
        `使用${minioConfig.useSSL ? 'HTTPS' : 'HTTP'}协议测试连接`,
      );

      const options = {
        hostname: minioConfig.endPoint,
        port: minioConfig.port,
        path: '/',
        method: 'HEAD',
        rejectUnauthorized: false,
        timeout: 5000,
      };

      // 创建请求
      const req = requestModule.request(options, (res) => {
        this.logger.log(`连接测试响应: ${res.statusCode}`);
        if (res.statusCode) {
          this.logger.log(
            `${minioConfig.useSSL ? 'HTTPS' : 'HTTP'}连接测试成功`,
          );
        }
      });

      // 错误处理
      req.on('error', (e) => {
        this.logger.error(`连接测试失败: ${e.message}`);
      });

      // 设置超时
      req.on('timeout', () => {
        this.logger.error('连接测试超时');
        req.destroy();
      });

      // 结束请求
      req.end();
    } catch (error) {
      this.logger.error(`创建连接测试请求失败: ${error.message}`);
    }
  }

  async onModuleInit() {
    await this.initWithRetry();
    this.initializationAttempted = true;
  }

  private async initWithRetry(retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.log(`尝试初始化MinIO连接 (尝试 ${attempt}/${retries})...`);
        await this.initializeBucket();
        this.initialized = true;
        this.logger.log('MinIO服务初始化成功');
        return;
      } catch (error) {
        this.logger.error(
          `MinIO服务初始化失败 (尝试 ${attempt}/${retries}): ${error.message}`,
          error.stack,
        );

        if (attempt < retries) {
          this.logger.log(`${delay / 1000}秒后重试...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`MinIO服务初始化失败，已达到最大重试次数(${retries})`);
    this.logger.log('将尝试在服务操作期间按需建立连接');
  }

  private async initializeBucket() {
    try {
      this.logger.log('测试MinIO连接...');

      // 直接检查存储桶是否存在
      this.logger.log(`检查存储桶 ${this.bucketName} 是否存在...`);
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);

      if (!bucketExists) {
        this.logger.log(`存储桶 ${this.bucketName} 不存在，正在创建...`);
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`存储桶 ${this.bucketName} 创建成功`);
      } else {
        this.logger.log(`存储桶 ${this.bucketName} 已存在`);
      }

      // 设置存储桶策略为公共读取
      const publicPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: ['*'],
            },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      this.logger.log(`正在设置存储桶 ${this.bucketName} 的公共访问策略...`);
      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(publicPolicy),
      );
      this.logger.log(`存储桶 ${this.bucketName} 公共访问策略设置成功`);
    } catch (error) {
      this.logger.error(`初始化存储桶失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async checkConnection() {
    if (this.forceBypassInitCheck) {
      if (!this.initialized && this.initializationAttempted) {
        this.logger.warn('MinIO服务未初始化，但已启用强制绕过。继续操作...');
        return;
      }
    }

    if (!this.initialized) {
      this.logger.warn('MinIO服务尚未初始化，正在尝试重新初始化...');
      await this.initWithRetry(1);
      if (!this.initialized && !this.forceBypassInitCheck) {
        throw new Error('MinIO服务未初始化，无法执行操作');
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      await this.checkConnection();
    } catch (error) {
      this.logger.warn(`连接检查失败，但将尝试继续: ${error.message}`);
    }

    try {
      // 1. 从 Multer 获取的原始文件名进行解码处理
      const decodedOriginalName = Buffer.from(
        file.originalname,
        'latin1',
      ).toString('utf8');

      // 2. 生成时间戳作为唯一标识符
      const timestamp = Date.now();

      // 3. 构建文件名，使用时间戳和解码后的原始文件名
      const fileName = `${timestamp}-${decodedOriginalName}`;

      this.logger.log(
        `正在上传文件: ${fileName}, 原始名称: ${file.originalname}, 解码后: ${decodedOriginalName}, 大小: ${file.size} 字节, 类型: ${file.mimetype}`,
      );

      // 4. 上传到 MinIO 服务器
      // 对中文文件名进行 Base64 编码，避免 HTTP 头部中的无效字符问题
      const encodedOriginalName = Buffer.from(decodedOriginalName).toString('base64');

      const metadata = {
        'Content-Type': file.mimetype,
        'Cache-Control': 'max-age=31536000',
        'X-Amz-Meta-Filename-Encoding': 'base64', // 标识使用了 base64 编码
        'X-Amz-Meta-Filename-Base64': encodedOriginalName, // 使用 base64 编码存储文件名
      };

      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        metadata,
      );

      this.logger.log(`文件上传成功: ${fileName}`);
      return fileName;
    } catch (error) {
      this.logger.error(`文件上传失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    await this.checkConnection();

    try {
      // 获取MinIO配置
      const minioConfig = this.configService.get('minio');

      // 构建永久有效的URL
      const isSecure = minioConfig.useSSL;
      const protocol = isSecure ? 'https' : 'http';
      const port =
        minioConfig.port !== 80 && minioConfig.port !== 443
          ? `:${minioConfig.port}`
          : '';

      let url;
      if (minioConfig.pathStyle) {
        // 对于使用路径样式的MinIO服务器
        url = `${protocol}://${minioConfig.endPoint}${port}/${this.bucketName}/${encodeURIComponent(fileName)}`;
      } else {
        // 对于使用子域名样式的MinIO服务器
        url = `${protocol}://${this.bucketName}.${minioConfig.endPoint}${port}/${encodeURIComponent(fileName)}`;
      }

      this.logger.log(`获取文件永久URL成功: ${fileName}, URL: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`获取文件URL失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.checkConnection();

    try {
      this.logger.log(`正在删除文件: ${fileName}`);
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`文件删除成功: ${fileName}`);
    } catch (error) {
      this.logger.error(`文件删除失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      await this.checkConnection();
    } catch (error) {
      this.logger.warn(`连接检查失败，但将尝试继续: ${error.message}`);
    }

    try {
      this.logger.log('正在获取文件列表');

      // 添加超时控制
      const timeoutPromise = new Promise<string[]>((_, reject) => {
        setTimeout(() => {
          reject(new Error('获取文件列表超时，请检查网络连接'));
        }, 30000); // 30秒超时
      });

      const listPromise = new Promise<string[]>((resolve, reject) => {
        try {
          const stream = this.minioClient.listObjects(this.bucketName);
          const files: string[] = [];

          stream.on('data', (obj) => {
            if (obj && obj.name) {
              files.push(obj.name);
            }
          });

          stream.on('end', () => {
            this.logger.log(`文件列表获取成功: ${files.length} 个文件`);
            resolve(files);
          });

          stream.on('error', (err) => {
            this.logger.error(
              `流处理中获取文件列表失败: ${err.message}`,
              err.stack,
            );
            reject(err);
          });
        } catch (innerError) {
          this.logger.error(
            `创建列表对象流失败: ${innerError.message}`,
            innerError.stack,
          );
          reject(innerError);
        }
      });

      // 使用Promise.race来处理超时
      return Promise.race([listPromise, timeoutPromise]);
    } catch (error) {
      this.logger.error(`获取文件列表失败: ${error.message}`, error.stack);

      // 返回空数组而不是抛出错误，避免整个API失败
      this.logger.warn('返回空文件列表');
      return [];
    }
  }

  async getBucketStatus(): Promise<{ exists: boolean; files: number }> {
    try {
      await this.checkConnection();
    } catch (error) {
      this.logger.warn(`连接检查失败，但将尝试继续: ${error.message}`);
    }

    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      this.logger.log(
        `存储桶 ${this.bucketName} ${bucketExists ? '存在' : '不存在'}`,
      );

      let fileCount = 0;
      if (bucketExists) {
        const files = await this.listFiles();
        fileCount = files.length;
      }

      return {
        exists: bucketExists,
        files: fileCount,
      };
    } catch (error) {
      this.logger.error(`获取存储桶状态失败: ${error.message}`, error.stack);
      return {
        exists: false,
        files: 0,
      };
    }
  }

  async getFileMetadata(fileName: string): Promise<Record<string, any>> {
    await this.checkConnection();

    try {
      this.logger.log(`正在获取文件元数据: ${fileName}`);

      // 使用 statObject 获取文件信息，其中包含元数据
      const stat = await this.minioClient.statObject(this.bucketName, fileName);

      this.logger.log(`获取文件元数据成功: ${fileName}`);
      return stat.metaData || {};
    } catch (error) {
      this.logger.error(`获取文件元数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
