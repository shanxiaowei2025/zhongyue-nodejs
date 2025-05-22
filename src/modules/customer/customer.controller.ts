// 控制器负责处理来自客户端的请求
// 主要功能：
// 1. 定义 API 路由（如 GET /customer, POST /customer 等）
// 2. 处理请求参数
// 3. 调用相应的服务方法
// 4. 返回响应给客户端
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Logger,
  Req,
  Put,
  HttpStatus,
  NotFoundException,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { ReplacePersonnelDto } from './dto/replace-personnel.dto';
import { ExportCustomerDto } from './dto/export-customer.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { memoryStorage } from 'multer';

@ApiTags('客户管理')
@ApiBearerAuth() // 需要登录才能访问
@UseGuards(JwtAuthGuard) // 使用JWT认证
@Controller('customer')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);
  
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: '创建客户信息' })
  @ApiResponse({ status: 201, description: '客户信息创建成功' })
  @ApiResponse({ status: 403, description: '没有创建客户的权限或统一社会信用代码已存在' })
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    this.logger.debug(`用户请求创建客户，用户信息: ${JSON.stringify(req.user)}`);
    
    // 检查用户ID是否存在
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.create(createCustomerDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取客户列表' })
  @ApiResponse({ status: 200, description: '获取客户列表成功' })
  findAll(@Query() query: QueryCustomerDto, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取客户详情' })
  @ApiResponse({ status: 200, description: '获取客户详情成功' })
  findOne(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新客户信息' })
  @ApiResponse({ status: 200, description: '客户信息更新成功' })
  @ApiResponse({ status: 403, description: '没有更新客户的权限或统一社会信用代码已存在' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.update(+id, updateCustomerDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户信息' })
  @ApiResponse({ status: 200, description: '客户信息删除成功' })
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.remove(+id, req.user.id);
  }

  @Post('batch-replace')
  @ApiOperation({ summary: '批量替换人员信息', description: '将特定职位的特定人员批量替换为其他人员' })
  @ApiResponse({ status: 200, description: '批量替换成功' })
  @ApiResponse({ status: 403, description: '没有权限执行此操作' })
  replacePersonnel(@Body() replacePersonnelDto: ReplacePersonnelDto, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    this.logger.debug(`用户请求批量替换人员，参数: ${JSON.stringify(replacePersonnelDto)}`);
    return this.customerService.replacePersonnel(replacePersonnelDto, req.user.id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: '导出客户数据为CSV' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportToCsv(
    @Query() query: ExportCustomerDto,
    @Req() req,
    @Res() res: Response
  ) {
    const csvData = await this.customerService.exportToCsv(query, req.user.id);
    
    // 生成带日期的文件名
    const filename = `customers.csv`;
    
    // 确保使用最通用的MIME类型和下载设置
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // 发送CSV数据并结束响应
    res.end(csvData);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file', {
    // 配置使用内存存储，确保file.buffer可用
    storage: memoryStorage()
  }))
  @ApiOperation({ summary: '导入客户Excel数据' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '客户数据Excel文件',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '导入成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 403, description: '没有权限执行此操作' })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new ForbiddenException('未提供文件');
    }

    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }

    try {
      // 记录文件信息以便调试
      this.logger.log(`用户 ${req.user.id} 开始导入客户数据, 文件信息: ${JSON.stringify({
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      })}`);
      
      // 检查文件buffer是否存在
      if (!file.buffer) {
        throw new Error('文件内容为空，请检查上传的文件');
      }
      
      // 调用customerService的importCustomers方法进行导入
      const result = await this.customerService.importCustomers(file, req.user.id);
      
      this.logger.log(`用户 ${req.user.id} 导入完成: ${result.message}`);
      return result;
    } catch (error) {
      this.logger.error(`用户 ${req.user.id} 导入失败: ${error.message}`);
      throw error;
    }
  }
}
