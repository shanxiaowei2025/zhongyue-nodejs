import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

@ApiTags('文件存储')
@ApiBearerAuth() // 需要登录才能访问
@UseGuards(CombinedAuthGuard) // 使用组合认证，支持JWT和合同令牌
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('status')
  @ApiOperation({
    summary: '获取存储服务状态',
    description: '获取MinIO存储服务连接状态和存储桶信息',
  })
  @ApiResponse({ status: 200, description: '获取存储服务状态成功' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async getStorageStatus() {
    try {
      this.logger.log('接收到获取存储服务状态请求');
      const status = await this.storageService.getBucketStatus();

      this.logger.log(`存储服务状态获取成功: ${JSON.stringify(status)}`);
      return status;
    } catch (error) {
      this.logger.error(`获取存储服务状态失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `获取存储服务状态失败: ${error.message}`,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件', description: '上传文件到MinIO存储，支持JWT认证或合同令牌认证' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        token: {
          type: 'string',
          description: '合同令牌(可选)，如果提供则使用合同令牌认证，否则使用JWT认证',
        },
      },
    },
  })
  @ApiQuery({
    name: 'token',
    required: false,
    description: '合同令牌(可选)，如果提供则使用合同令牌认证，否则使用JWT认证',
  })
  @ApiResponse({ status: 201, description: '文件上传成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权，令牌无效' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('token') queryToken?: string,
    @Body('token') bodyToken?: string,
  ) {
    if (!file) {
      this.logger.error('上传文件失败: 未提供文件');
      throw new BadRequestException('未提供文件');
    }

    // 优先使用查询参数中的token，其次使用请求体中的token
    const token = queryToken || bodyToken;
    
    // 记录认证信息
    this.logger.log(
      `接收到文件上传请求: ${file.originalname}, 大小: ${file.size} 字节, 认证方式: ${token ? '合同令牌' : 'JWT认证'}`
    );
    
    if (token) {
      this.logger.debug(`使用合同令牌认证，token: ${token.substring(0, 10)}...`);
    }

    try {
      const fileName = await this.storageService.uploadFile(file);
      const url = await this.storageService.getFileUrl(fileName);

      this.logger.log(`文件上传成功: ${fileName}, URL: ${url}`);
      return {
        fileName,
        url,
      };
    } catch (error) {
      this.logger.error(`文件上传处理失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`文件上传失败: ${error.message}`);
    }
  }

  @Get('files')
  @ApiOperation({
    summary: '获取文件列表',
    description: '获取存储桶中的所有文件列表',
  })
  @ApiResponse({ status: 200, description: '获取文件列表成功' })
  async listFiles() {
    try {
      this.logger.log('接收到获取文件列表请求');
      const files = await this.storageService.listFiles();

      this.logger.log(`获取到${files.length}个文件，正在获取URL...`);

      const filesWithUrls = await Promise.all(
        files.map(async (fileName) => {
          try {
            const url = await this.storageService.getFileUrl(fileName);
            return { fileName, url };
          } catch (error) {
            this.logger.warn(
              `获取文件 ${fileName} 的URL失败: ${error.message}`,
            );
            return { fileName, url: null };
          }
        }),
      );

      this.logger.log(
        `文件列表处理完成，返回${filesWithUrls.length}个文件信息`,
      );
      return filesWithUrls;
    } catch (error) {
      this.logger.error(`获取文件列表失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `获取文件列表失败: ${error.message}`,
      );
    }
  }

  @Delete('files/:fileName')
  @ApiOperation({ summary: '删除文件', description: '从存储桶中删除指定文件' })
  @ApiResponse({ status: 200, description: '文件删除成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async deleteFile(@Param('fileName') fileName: string) {
    try {
      this.logger.log(`接收到删除文件请求: ${fileName}`);
      await this.storageService.deleteFile(fileName);
      this.logger.log(`文件删除成功: ${fileName}`);
      return { message: '文件删除成功' };
    } catch (error) {
      this.logger.error(`删除文件失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`删除文件失败: ${error.message}`);
    }
  }

  @Get('files/:fileName')
  @ApiOperation({
    summary: '获取文件URL',
    description: '获取指定文件的临时访问URL',
  })
  @ApiResponse({ status: 200, description: '获取文件URL成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async getFileUrl(@Param('fileName') fileName: string) {
    try {
      this.logger.log(`接收到获取文件URL请求: ${fileName}`);
      const url = await this.storageService.getFileUrl(fileName);
      this.logger.log(`获取文件URL成功: ${fileName}`);
      
      // 尝试获取文件元数据以检查是否有原始文件名
      let originalFileName = fileName;
      try {
        const metadata = await this.storageService.getFileMetadata(fileName);
        if (metadata && metadata['X-Amz-Meta-Filename-Base64']) {
          // 如果存在 Base64 编码的文件名，则解码
          const encodedName = metadata['X-Amz-Meta-Filename-Base64'];
          originalFileName = Buffer.from(encodedName, 'base64').toString(
            'utf8',
          );
          this.logger.log(`解码后的原始文件名: ${originalFileName}`);
        }
      } catch (metaError) {
        this.logger.warn(
          `获取文件元数据失败，使用默认文件名: ${metaError.message}`,
        );
      }
      
      return {
        fileName: originalFileName,
        url,
      };
    } catch (error) {
      this.logger.error(`获取文件URL失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `获取文件URL失败: ${error.message}`,
      );
    }
  }
}
