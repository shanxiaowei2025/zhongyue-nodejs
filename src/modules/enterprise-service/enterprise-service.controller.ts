import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EnterpriseServiceService } from './enterprise-service.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Customer } from '../customer/entities/customer.entity';
 
@ApiTags('企业服务')
@Controller('enterprise-service')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnterpriseServiceController {
  constructor(private readonly enterpriseServiceService: EnterpriseServiceService) {}

  @Get('customer')
  @ApiOperation({ summary: '获取客户列表', description: '只有顾问会计、记账会计、管理员和超级管理员可以访问' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles('consultantAccountant', 'bookkeepingAccountant', 'admin', 'super_admin')
  async getCustomers(@Query() query: QueryCustomerDto) {
    return this.enterpriseServiceService.getAllCustomers(query);
  }

  @Get('customer/:id')
  @ApiOperation({ summary: '获取单个客户详情', description: '只有顾问会计、记账会计、管理员和超级管理员可以访问' })
  @ApiParam({ name: 'id', description: '客户ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功', type: Customer })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @Roles('consultantAccountant', 'bookkeepingAccountant', 'admin', 'super_admin')
  async getCustomerById(@Param('id') id: string) {
    return this.enterpriseServiceService.getCustomerInfo(+id);
  }
} 