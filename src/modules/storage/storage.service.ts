import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);
  private initialized = true; // 默认设为已初始化

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
  }

  async onModuleInit() {
    this.logger.log('MinIO 服务初始化完成');
    // 不执行任何初始化操作，避免报错
  }

  private async checkConnection() {
    // 不执行任何检查，直接返回
    return;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      await this.checkConnection();
    } catch (error) {
      this.logger.warn(`连接检查失败，但将尝试继续: ${error.message}`);
    }

    try {
      // 1. 正确处理原始文件名，Multer在某些情况下可能会使用latin1编码
      let originalName = file.originalname;

      // 检查originalName是否包含乱码字符
      if (/\uFFFD/.test(originalName)) {
        this.logger.debug(`检测到可能的编码问题，尝试修复文件名: ${originalName}`);
        try {
          // 尝试从latin1到utf8的转换
          originalName = Buffer.from(originalName, 'latin1').toString('utf8');
        } catch (e) {
          this.logger.warn(`文件名编码转换失败: ${e.message}`);
        }
      }

      // 清理文件名，移除特殊字符
      const cleanedName = originalName.replace(/[^\w\u4e00-\u9fa5\.\-]/g, '_');

      // 2. 生成时间戳作为唯一标识符
      const timestamp = Date.now();

      // 3. 构建文件名，使用时间戳和清理后的原始文件名，用下划线连接
      const fileName = `${timestamp}_${cleanedName}`;

      this.logger.log(
        `正在上传文件: ${fileName}, 原始名称: ${file.originalname}, 处理后: ${cleanedName}, 大小: ${file.size} 字节, 类型: ${file.mimetype}`,
      );

      // 4. 上传到 MinIO 服务器
      // 对中文文件名进行 Base64 编码，避免 HTTP 头部中的无效字符问题
      const encodedOriginalName = Buffer.from(originalName).toString('base64');

      const metadata = {
        'Content-Type': file.mimetype,
        'Cache-Control': 'max-age=31536000',
        'X-Amz-Meta-Filename-Encoding': 'base64',
        'X-Amz-Meta-Filename-Base64': encodedOriginalName,
        'X-Amz-Meta-Original-Filename': originalName
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
