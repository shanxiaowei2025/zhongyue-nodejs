import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommissionService } from './commission.service';
import { Public } from '../../auth/decorators/public.decorator';

import {
  CreateAgencyCommissionDto,
  CreateBusinessSalesCommissionDto,
  CreateBusinessConsultantCommissionDto,
  CreateBusinessOtherCommissionDto,
  CreatePerformanceCommissionDto,
  QueryAgencyCommissionDto,
  QueryBusinessSalesCommissionDto,
  QueryBusinessCommissionDto,
  QueryPerformanceCommissionDto,
  UpdateAgencyCommissionDto,
  UpdateBusinessSalesCommissionDto,
  UpdateBusinessCommissionDto,
  UpdatePerformanceCommissionDto
} from './dto';

@ApiTags('薪资管理提成表')
@Controller('commission')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // 代理费提成表接口
  @Post('agency')
  @ApiOperation({ summary: '创建代理费提成记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createAgencyCommission(@Body() dto: CreateAgencyCommissionDto) {
    return this.commissionService.createAgencyCommission(dto);
  }

  @Get('agency')
  @ApiOperation({ summary: '查询代理费提成记录列表' })
  findAllAgencyCommission(@Query() query: QueryAgencyCommissionDto) {
    return this.commissionService.findAllAgencyCommission(query);
  }

  @Get('agency/:id')
  @ApiOperation({ summary: '查询单个代理费提成记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findOneAgencyCommission(@Param('id') id: string) {
    return this.commissionService.findOneAgencyCommission(+id);
  }

  @Patch('agency/:id')
  @ApiOperation({ summary: '更新代理费提成记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateAgencyCommission(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyCommissionDto,
  ) {
    return this.commissionService.updateAgencyCommission(+id, dto);
  }

  @Delete('agency/:id')
  @ApiOperation({ summary: '删除代理费提成记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  removeAgencyCommission(@Param('id') id: string) {
    return this.commissionService.removeAgencyCommission(+id);
  }

  // 业务提成表销售接口
  @Post('sales')
  @ApiOperation({ summary: '创建业务提成表销售记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createBusinessSalesCommission(@Body() dto: CreateBusinessSalesCommissionDto) {
    return this.commissionService.createBusinessSalesCommission(dto);
  }

  @Get('sales')
  @ApiOperation({ summary: '查询业务提成表销售记录列表' })
  findAllBusinessSalesCommission(@Query() query: QueryBusinessSalesCommissionDto) {
    return this.commissionService.findAllBusinessSalesCommission(query);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: '查询单个业务提成表销售记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findOneBusinessSalesCommission(@Param('id') id: string) {
    return this.commissionService.findOneBusinessSalesCommission(+id);
  }

  @Patch('sales/:id')
  @ApiOperation({ summary: '更新业务提成表销售记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateBusinessSalesCommission(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessSalesCommissionDto,
  ) {
    return this.commissionService.updateBusinessSalesCommission(+id, dto);
  }

  @Delete('sales/:id')
  @ApiOperation({ summary: '删除业务提成表销售记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  removeBusinessSalesCommission(@Param('id') id: string) {
    return this.commissionService.removeBusinessSalesCommission(+id);
  }

  // 业务提成表顾问接口
  @Post('consultant')
  @ApiOperation({ summary: '创建业务提成表顾问记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createBusinessConsultantCommission(@Body() dto: CreateBusinessConsultantCommissionDto) {
    return this.commissionService.createBusinessConsultantCommission(dto);
  }

  @Get('consultant')
  @ApiOperation({ summary: '查询业务提成表顾问记录列表' })
  findAllBusinessConsultantCommission(@Query() query: QueryBusinessCommissionDto) {
    return this.commissionService.findAllBusinessConsultantCommission(query);
  }

  @Get('consultant/:id')
  @ApiOperation({ summary: '查询单个业务提成表顾问记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findOneBusinessConsultantCommission(@Param('id') id: string) {
    return this.commissionService.findOneBusinessConsultantCommission(+id);
  }

  @Patch('consultant/:id')
  @ApiOperation({ summary: '更新业务提成表顾问记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateBusinessConsultantCommission(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessCommissionDto,
  ) {
    return this.commissionService.updateBusinessConsultantCommission(+id, dto);
  }

  @Delete('consultant/:id')
  @ApiOperation({ summary: '删除业务提成表顾问记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  removeBusinessConsultantCommission(@Param('id') id: string) {
    return this.commissionService.removeBusinessConsultantCommission(+id);
  }

  // 业务提成表其他接口
  @Post('other')
  @ApiOperation({ summary: '创建业务提成表其他记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createBusinessOtherCommission(@Body() dto: CreateBusinessOtherCommissionDto) {
    return this.commissionService.createBusinessOtherCommission(dto);
  }

  @Get('other')
  @ApiOperation({ summary: '查询业务提成表其他记录列表' })
  findAllBusinessOtherCommission(@Query() query: QueryBusinessCommissionDto) {
    return this.commissionService.findAllBusinessOtherCommission(query);
  }

  @Get('other/:id')
  @ApiOperation({ summary: '查询单个业务提成表其他记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findOneBusinessOtherCommission(@Param('id') id: string) {
    return this.commissionService.findOneBusinessOtherCommission(+id);
  }

  @Patch('other/:id')
  @ApiOperation({ summary: '更新业务提成表其他记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateBusinessOtherCommission(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessCommissionDto,
  ) {
    return this.commissionService.updateBusinessOtherCommission(+id, dto);
  }

  @Delete('other/:id')
  @ApiOperation({ summary: '删除业务提成表其他记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  removeBusinessOtherCommission(@Param('id') id: string) {
    return this.commissionService.removeBusinessOtherCommission(+id);
  }

  // 业务方法 - 根据金额查询匹配的提成比例
  @Get('rate/amount')
  @Public()
  @ApiOperation({ 
    summary: '根据金额查询匹配的提成比例',
    description: `
根据提供的金额、类型和其他筛选条件查询匹配的提成比例。

**测试案例:**

1. 查询业务销售提成率:
   \`GET /api/commission/rate/amount?amount=5000&type=sales&salesType=转正后\`

2. 查询代理费提成率(整数代理户数):
   \`GET /api/commission/rate/amount?amount=20000&type=agency&agencyCount=180\`

3. 查询业务顾问提成率:
   \`GET /api/commission/rate/amount?amount=18000&type=consultant\`

4. 查询其他业务提成率:
   \`GET /api/commission/rate/amount?amount=10000&type=other\`

5. 无匹配结果:
   \`GET /api/commission/rate/amount?amount=100000&type=consultant\`
`
  })
  @ApiQuery({
    name: 'amount',
    required: true,
    description: '金额',
    type: Number,
    examples: {
      '5000元': { value: 5000 },
      '20000元': { value: 20000 }
    }
  })
  @ApiQuery({
    name: 'type',
    required: true,
    description: '提成类型',
    enum: ['agency', 'sales', 'consultant', 'other'],
    examples: {
      '代理费提成': { value: 'agency' },
      '业务销售提成': { value: 'sales' },
      '业务顾问提成': { value: 'consultant' },
      '其他业务提成': { value: 'other' }
    }
  })
  @ApiQuery({
    name: 'agencyCount',
    required: false,
    description: '代理户数（整数），当type=agency时有效',
    type: Number,
    examples: {
      '120户': { value: 120 },
      '180户': { value: 180 },
      '260户': { value: 260 }
    }
  })
  @ApiQuery({
    name: 'salesType',
    required: false,
    description: '销售类型，当type=sales时有效',
    type: String,
    examples: {
      '转正后': { value: '转正后' },
      '入职满2年': { value: '入职满2年' },
      '通用': { value: '通用' }
    }
  })
  @ApiResponse({
    status: 200,
    description: '返回匹配的提成记录',
    schema: {
      example: {
        matched: true,
        record: {
          id: 3,
          agencyCount: "151-200",
          minCommissionBase: "20000.00",
          feeRange: "20000-35000",
          commissionRate: "0.010",
          createdAt: "2025-06-26T22:12:21.000Z",
          updatedAt: "2025-06-26T22:12:21.000Z"
        }
      }
    }
  })
  getCommissionRateByAmount(
    @Query('amount') amount: number,
    @Query('type') type: 'agency' | 'sales' | 'consultant' | 'other',
    @Query('agencyCount') agencyCount?: number,
    @Query('salesType') salesType?: string,
  ) {
    const filterOptions = {
      agencyCount,
      type: salesType,
    };
    return this.commissionService.getCommissionRateByAmount(amount, type, filterOptions);
  }

  // 绩效提成表接口
  @Post('performance')
  @ApiOperation({ summary: '创建绩效提成记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createPerformanceCommission(@Body() dto: CreatePerformanceCommissionDto) {
    return this.commissionService.createPerformanceCommission(dto);
  }

  @Get('performance')
  @ApiOperation({ summary: '查询绩效提成记录列表' })
  findAllPerformanceCommission(@Query() query: QueryPerformanceCommissionDto) {
    return this.commissionService.findAllPerformanceCommission(query);
  }

  @Get('performance/:id')
  @ApiOperation({ summary: '查询单个绩效提成记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findOnePerformanceCommission(@Param('id') id: string) {
    return this.commissionService.findOnePerformanceCommission(+id);
  }

  @Patch('performance/:id')
  @ApiOperation({ summary: '更新绩效提成记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updatePerformanceCommission(
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceCommissionDto,
  ) {
    return this.commissionService.updatePerformanceCommission(+id, dto);
  }

  @Delete('performance/:id')
  @ApiOperation({ summary: '删除绩效提成记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  removePerformanceCommission(@Param('id') id: string) {
    return this.commissionService.removePerformanceCommission(+id);
  }
} 