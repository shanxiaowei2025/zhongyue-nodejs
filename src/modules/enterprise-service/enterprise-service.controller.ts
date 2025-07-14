import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EnterpriseServiceService } from './enterprise-service.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Customer } from '../customer/entities/customer.entity';
import { EnterprisePermissionGuard } from './guards/enterprise-permission.guard';
 
@ApiTags('企业服务')
@Controller('enterprise-service')
@UseGuards(JwtAuthGuard, EnterprisePermissionGuard)
@ApiBearerAuth()
export class EnterpriseServiceController {
  constructor(private readonly enterpriseServiceService: EnterpriseServiceService) {}

  @Get('customer')
  @ApiOperation({ summary: '获取客户列表', description: '顾问会计、记账会计、管理员、超级管理员或拥有contract_action_create、expense_action_create权限的角色可以访问' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles('consultantAccountant', 'bookkeepingAccountant', 'admin', 'super_admin')
  async getCustomers(@Query() query: QueryCustomerDto) {
    return this.enterpriseServiceService.getAllCustomers(query);
  }

  @Get('customer/:id')
  @ApiOperation({ summary: '获取单个客户详情', description: '顾问会计、记账会计、管理员、超级管理员或拥有contract_action_create、expense_action_create权限的角色可以访问' })
  @ApiParam({ name: 'id', description: '客户ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功', type: Customer })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @Roles('consultantAccountant', 'bookkeepingAccountant', 'admin', 'super_admin')
  async getCustomerById(@Param('id') id: string) {
    return this.enterpriseServiceService.getCustomerInfo(+id);
  }
} 