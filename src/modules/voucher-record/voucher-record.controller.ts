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
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
  Res,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { VoucherRecordService } from './voucher-record.service';
import { CreateVoucherRecordYearDto } from './dto/create-voucher-record-year.dto';
import { UpdateVoucherRecordYearDto } from './dto/update-voucher-record-year.dto';
import { CreateVoucherRecordMonthDto } from './dto/create-voucher-record-month.dto';
import { UpdateVoucherRecordMonthDto } from './dto/update-voucher-record-month.dto';
import { QueryVoucherRecordDto } from './dto/query-voucher-record.dto';
import { ExportVoucherRecordDto } from './dto/export-voucher-record.dto';
import { BatchDeleteMonthsDto } from './dto/batch-delete-months.dto';
import { MonthStatusUpdateDto } from './dto/batch-update-month-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoucherRecordPermissionGuard, VoucherRecordPermission } from './guards/voucher-record-permission.guard';

@ApiTags('凭证存放记录管理')
@Controller('voucher-record')
@UseGuards(JwtAuthGuard, VoucherRecordPermissionGuard)
@ApiBearerAuth()
export class VoucherRecordController {
  constructor(private readonly voucherRecordService: VoucherRecordService) {}

  // 年度记录管理
  @Post('years')
  @VoucherRecordPermission('create')
  @ApiOperation({ summary: '创建年度凭证记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '记录已存在' })
  async createYear(@Body() createDto: CreateVoucherRecordYearDto) {
    return await this.voucherRecordService.createYear(createDto);
  }

  @Get('years')
  @VoucherRecordPermission('view')
  @ApiOperation({ summary: '获取年度凭证记录列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: '每页数量', required: false, type: Number })
  @ApiQuery({ name: 'customerId', description: '客户ID', required: false, type: Number })
  @ApiQuery({ name: 'year', description: '年度', required: false, type: Number })
  @ApiQuery({ name: 'storageLocation', description: '存放位置关键词', required: false, type: String })
  @ApiQuery({ name: 'handler', description: '经手人关键词', required: false, type: String })
  @ApiQuery({ name: 'status', description: '月度状态筛选', required: false, type: String })
  @ApiQuery({ name: 'consultantAccountant', description: '顾问会计关键词（传空字符串可筛选空值数据）', required: false, type: String })
  @ApiQuery({ name: 'bookkeepingAccountant', description: '记账会计关键词（传空字符串可筛选空值数据）', required: false, type: String })
  async findAllYears(@Query() query: QueryVoucherRecordDto) {
    return await this.voucherRecordService.findAllYears(query);
  }

  @Get('years/:id')
  @VoucherRecordPermission('view')
  @ApiOperation({ summary: '获取年度凭证记录详情' })
  @ApiParam({ name: 'id', description: '年度记录ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async findYearById(@Param('id', ParseIntPipe) id: number) {
    return await this.voucherRecordService.findYearById(id);
  }

  @Patch('years/:id')
  @VoucherRecordPermission('edit')
  @ApiOperation({ summary: '更新年度凭证记录' })
  @ApiParam({ name: 'id', description: '年度记录ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 409, description: '记录已存在' })
  async updateYear(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVoucherRecordYearDto,
  ) {
    return await this.voucherRecordService.updateYear(id, updateDto);
  }

  @Delete('years/:id')
  @VoucherRecordPermission('delete')
  @ApiOperation({ summary: '删除年度凭证记录' })
  @ApiParam({ name: 'id', description: '年度记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async removeYear(@Param('id', ParseIntPipe) id: number) {
    await this.voucherRecordService.removeYear(id);
    return { message: '删除成功' };
  }

  // 根据客户获取年度记录
  @Get('customers/:customerId/years')
  @VoucherRecordPermission('view')
  @ApiOperation({ summary: '获取客户的所有年度记录' })
  @ApiParam({ name: 'customerId', description: '客户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findYearsByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return await this.voucherRecordService.findYearsByCustomer(customerId);
  }

  // 月度记录管理
  @Post('months')
  @VoucherRecordPermission('create')
  @ApiOperation({ summary: '创建月度凭证记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '记录已存在' })
  async createMonth(@Body() createDto: CreateVoucherRecordMonthDto) {
    return await this.voucherRecordService.createMonth(createDto);
  }

  @Get('months/:id')
  @VoucherRecordPermission('view')
  @ApiOperation({ summary: '获取月度凭证记录详情' })
  @ApiParam({ name: 'id', description: '月度记录ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async findMonthById(@Param('id', ParseIntPipe) id: number) {
    return await this.voucherRecordService.findMonthById(id);
  }

  @Patch('months/:id')
  @VoucherRecordPermission('edit')
  @ApiOperation({ summary: '更新月度凭证记录' })
  @ApiParam({ name: 'id', description: '月度记录ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async updateMonth(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVoucherRecordMonthDto,
  ) {
    return await this.voucherRecordService.updateMonth(id, updateDto);
  }

  @Delete('months/batch')
  @VoucherRecordPermission('delete')
  @ApiOperation({ summary: '批量删除月度凭证记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async removeMonthsByIds(@Body() batchDeleteDto: BatchDeleteMonthsDto) {
    await this.voucherRecordService.removeMonthsByIds(batchDeleteDto.ids);
    return { message: '批量删除成功' };
  }

  @Delete('months/:id')
  @VoucherRecordPermission('delete')
  @ApiOperation({ summary: '删除月度凭证记录' })
  @ApiParam({ name: 'id', description: '月度记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async removeMonth(@Param('id', ParseIntPipe) id: number) {
    await this.voucherRecordService.removeMonth(id);
    return { message: '删除成功' };
  }

  @Delete('years/:yearRecordId/months')
  @VoucherRecordPermission('delete')
  @ApiOperation({ summary: '删除年度记录下的所有月度记录（同时删除年度记录）' })
  @ApiParam({ name: 'yearRecordId', description: '年度记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '年度记录不存在' })
  async removeMonthsByYearRecord(@Param('yearRecordId', ParseIntPipe) yearRecordId: number) {
    await this.voucherRecordService.removeMonthsByYearRecord(yearRecordId);
    return { message: '删除成功' };
  }

  // 批量更新月度状态
  @Patch('years/:yearRecordId/months/batch')
  @VoucherRecordPermission('edit')
  @ApiOperation({ summary: '批量更新月度状态' })
  @ApiParam({ name: 'yearRecordId', description: '年度记录ID' })
  @ApiBody({ 
    type: [MonthStatusUpdateDto],
    description: '月度状态更新列表',
    examples: {
      example1: {
        summary: '批量更新示例',
        value: [
          {
            month: 1,
            status: '已完成',
            description: '1月份凭证已处理完成'
          },
          {
            month: 2,
            status: '进行中',
            description: '2月份凭证处理中'
          },
          {
            month: 3,
            status: '待处理'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '年度记录不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async batchUpdateMonthStatus(
    @Param('yearRecordId', ParseIntPipe) yearRecordId: number,
    @Body() updates: MonthStatusUpdateDto[],
  ) {
    return await this.voucherRecordService.batchUpdateMonthStatus(yearRecordId, updates);
  }

  // 获取月度统计信息
  @Get('years/:yearRecordId/statistics')
  @VoucherRecordPermission('view')
  @ApiOperation({ summary: '获取年度记录的月度统计信息' })
  @ApiParam({ name: 'yearRecordId', description: '年度记录ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '年度记录不存在' })
  async getMonthStatistics(@Param('yearRecordId', ParseIntPipe) yearRecordId: number) {
    return await this.voucherRecordService.getMonthStatistics(yearRecordId);
  }

  // 导出凭证记录
  @Post('export')
  @VoucherRecordPermission('export')
  @ApiOperation({ summary: '导出凭证记录为Excel文件' })
  @ApiResponse({ 
    status: 200, 
    description: '导出成功',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportVoucherRecords(
    @Body() exportDto: ExportVoucherRecordDto,
    @Res() res: Response,
  ) {
    const buffer = await this.voucherRecordService.exportVoucherRecords(exportDto);
    
    // 生成文件名
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    const filename = `凭证记录_${timestamp}.xlsx`;
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    
    // 返回文件
    res.end(buffer);
  }
} 