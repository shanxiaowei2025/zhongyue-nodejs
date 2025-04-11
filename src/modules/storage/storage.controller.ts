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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('文件存储')
@ApiBearerAuth() // 需要登录才能访问
@UseGuards(JwtAuthGuard) // 使用JWT认证
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件', description: '上传文件到MinIO存储' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '文件上传成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      this.logger.error('上传文件失败: 未提供文件');
      throw new BadRequestException('未提供文件');
    }

    try {
      this.logger.log(
        `接收到文件上传请求: ${file.originalname}, 大小: ${file.size} 字节`,
      );
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
      return {
        fileName,
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
