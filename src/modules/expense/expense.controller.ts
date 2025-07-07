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
  Req,
  ForbiddenException,
  Request,
  BadRequestException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ViewReceiptDto } from './dto/view-receipt.dto';
import { CancelAuditDto } from './dto/cancel-audit.dto';
import { ExportExpenseDto } from './dto/export-expense.dto';
import { Response } from 'express';
import { QueryReceiptDto } from './dto/query-receipt.dto';
import { QueryMaxDatesDto } from './dto/query-max-dates.dto';

@ApiTags('费用管理')
@Controller('expense')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: '创建费用记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req) {
    return this.expenseService.create(createExpenseDto, req.user.username);
  }

  @Get('receipt')
  @ApiOperation({ 
    summary: '查看费用收据', 
    description: '通过ID或收据编号查询费用收据。参数示例：/api/expense/receipt?id=67688 或 /api/expense/receipt?receiptNo=202407010001' 
  })
  @ApiResponse({ status: 200, description: '查看成功', type: ViewReceiptDto })
  @ApiQuery({ name: 'id', required: false, description: '费用记录ID，与receiptNo至少提供一个' })
  @ApiQuery({ name: 'receiptNo', required: false, description: '收据编号，与id至少提供一个' })
  viewReceipt(@Query() query: any, @Req() req) {
    console.log(`收据查询 - 原始参数: ${JSON.stringify(query)}`);
    
    const params: { id?: number, receiptNo?: string } = {};
    
    // 直接从query中获取原始参数
    const rawId = query.id;
    const rawReceiptNo = query.receiptNo;
    
    console.log(`原始参数 - id: ${rawId} (${typeof rawId}), receiptNo: ${rawReceiptNo}`);
    
    // 处理ID参数
    if (rawId !== undefined && rawId !== null && rawId !== '') {
      // 尝试将ID转换为数字
      const id = Number(rawId);
      console.log(`处理ID参数: ${rawId} -> ${id}, isNaN: ${isNaN(id)}`);
      
      if (!isNaN(id)) {
        params.id = id;
      } else {
        console.warn(`无效的ID格式: ${rawId}`);
        throw new BadRequestException(`无效的费用ID格式: ${rawId}`);
      }
    }
    
    // 处理receiptNo参数
    if (rawReceiptNo) {
      params.receiptNo = String(rawReceiptNo).trim();
      console.log(`处理receiptNo参数: ${params.receiptNo}`);
    }
    
    console.log(`最终处理的参数: ${JSON.stringify(params)}`);
    
    // 确保至少有一个有效的查询参数
    if (Object.keys(params).length === 0) {
      throw new BadRequestException('请提供有效的费用ID或收据编号');
    }
    
    return this.expenseService.viewReceipt(params, req.user.id);
  }
  
  @Get('autocomplete/:field')
  @ApiOperation({ summary: '获取去重后的字段值列表' })
  getAutocompleteOptions(@Param('field') field: string) {
    return this.expenseService.getAutocompleteOptions(field);
  }
  
  @Get('export/csv')
  @ApiOperation({ summary: '导出费用记录为CSV' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportToCsv(
    @Query() query: ExportExpenseDto,
    @Req() req,
    @Res() res: Response
  ) {
    const csvData = await this.expenseService.exportToCsv(query, req.user.id);
    
    // 生成带日期的文件名
    const filename = `expense.csv`;
    
    // 确保使用最通用的MIME类型和下载设置
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // 发送CSV数据并结束响应
    res.end(csvData);
  }

  @Get()
  @ApiOperation({ summary: '获取费用列表' })
  @ApiResponse({ status: 200, description: '成功获取费用列表' })
  findAll(@Query() query: QueryExpenseDto, @Req() req) {
    const { page, pageSize, ...filters } = query;
    const pagination = { page, pageSize };
    
    return this.expenseService.findAll(filters, pagination, req.user.id);
  }

  // 获取企业最大日期的下个月 - 移到:id路由前面
  @Get('max-dates-next-month')
  @ApiOperation({ summary: '获取企业的最大日期的下个月，格式为YYYY-MM' })
  @ApiQuery({ name: 'companyName', required: false, description: '企业名称' })
  @ApiQuery({ name: 'unifiedSocialCreditCode', required: false, description: '统一社会信用代码' })
  async getMaxDatesNextMonth(
    @Query() queryDto: QueryMaxDatesDto, 
    @Request() req
  ) {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        throw new UnauthorizedException('用户未认证');
      }
      
      const result = await this.expenseService.getMaxDatesNextMonth(queryDto);
      // 直接返回结果，不需要访问data属性
      return result;
    } catch (error) {
      console.error('获取最大日期的下个月出错:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个费用记录' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.expenseService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新费用记录', description: '管理员可编辑任何记录，被退回的记录原提交人可编辑' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return await this.expenseService.update(
      +id, 
      updateExpenseDto, 
      req.user.id,
      req.user.username // 传递当前用户名
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除费用记录' })
  remove(@Param('id') id: string, @Req() req) {
    return this.expenseService.remove(+id, req.user.id);
  }

  @Post(':id/audit')
  @ApiOperation({ summary: '审核费用记录', description: '可设置为通过(1)或退回(2)状态' })
  @ApiParam({ name: 'id', description: '费用记录ID', example: 1 })
  @ApiBody({
    description: '审核数据',
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'number',
          description: '审核状态：1-通过，2-退回',
          enum: [1, 2],
          example: 1
        },
        reason: {
          type: 'string', 
          description: '退回原因（状态为2时必填）',
          example: '请补充发票信息'
        }
      },
      examples: {
        '审核通过': {
          value: {
            status: 1
          },
          summary: '审核通过示例'
        },
        '审核退回': {
          value: {
            status: 2,
            reason: '请补充发票信息'
          },
          summary: '审核退回示例'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: '审核成功' })
  @ApiResponse({ status: 400, description: '退回时未提供退回原因' })
  @ApiResponse({ status: 403, description: '没有权限审核费用记录' })
  @ApiResponse({ status: 404, description: '费用记录不存在' })
  async auditExpense(
    @Param('id') id: string,
    @Body() auditDto: { status: number, reason?: string },
    @Request() req
  ) {
    console.log(`收到审核请求 - ID: ${id}, 状态: ${auditDto.status}, 原因: ${auditDto.reason || '无'}`);
    console.log(`用户信息 - ID: ${req.user.id}, 用户名: ${req.user.username}`);
    
    if (auditDto.status === 2 && !auditDto.reason) {
      throw new BadRequestException('退回时必须提供退回原因');
    }
    
    const result = await this.expenseService.audit(
      +id,
      req.user.id,
      req.user.username,
      auditDto.status,
      auditDto.reason
    );
    
    console.log(`审核完成 - 结果:`, JSON.stringify(result));
    return result;
  }

  @Post(':id/cancel-audit')
  @ApiOperation({ summary: '取消审核' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer JWT令牌',
    required: true
  })
  cancelAudit(
    @Param('id') id: string,
    @Body() cancelAuditDto: CancelAuditDto,
    @Req() req
  ) {
    return this.expenseService.cancelAudit(
      +id,
      req.user.id,
      req.user.username,
      cancelAuditDto.cancelReason
    );
  }
} 