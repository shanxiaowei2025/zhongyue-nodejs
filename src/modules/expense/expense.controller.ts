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
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ViewReceiptDto } from './dto/view-receipt.dto';
import { CancelAuditDto } from './dto/cancel-audit.dto';

@ApiTags('费用管理')
@Controller('expense')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: '创建费用记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req) {
    return this.expenseService.create(createExpenseDto, req.user.username);
  }

  @Get()
  @ApiOperation({ summary: '获取费用记录列表' })
  findAll(@Query() query: any, @Query() pagination: PaginationDto, @Req() req) {
    return this.expenseService.findAll(query, pagination, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个费用记录' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.expenseService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新费用记录' })
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @Req() req) {
    return this.expenseService.update(+id, updateExpenseDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除费用记录' })
  remove(@Param('id') id: string, @Req() req) {
    return this.expenseService.remove(+id, req.user.id);
  }

  @Post(':id/audit')
  @ApiOperation({ summary: '审核费用记录' })
  @ApiParam({ name: 'id', description: '费用记录ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'number',
          enum: [1, 2],
          description: '审核状态：1-通过，2-拒绝'
        },
        rejectReason: {
          type: 'string',
          description: '拒绝原因（status=2时必填）'
        }
      },
      required: ['status']
    }
  })
  audit(
    @Param('id') id: string,
    @Body('status') status: number,
    @Body('rejectReason') rejectReason: string,
  @Req() req,
  ) {
    return this.expenseService.audit(+id, req.user.id, req.user.username, status, rejectReason);
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

  @Get('autocomplete/:field')
  @ApiOperation({ summary: '获取字段自动完成选项' })
  getAutocompleteOptions(@Param('field') field: string) {
    return this.expenseService.getAutocompleteOptions(field);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: '查看费用收据' })
  @ApiResponse({ status: 200, description: '查看成功', type: ViewReceiptDto })
  viewReceipt(@Param('id') id: string, @Req() req) {
    return this.expenseService.viewReceipt(+id, req.user.id);
  }
} 