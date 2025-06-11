import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceHistoryService } from './service-history.service';
import { FindByCompanyDto } from './dto/find-by-company.dto';
import { ServiceHistoryResponseDto } from './dto/service-history-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
 
@ApiTags('服务历程')
@ApiBearerAuth()
@Controller('enterprise-service/service-history')
export class ServiceHistoryController {
  constructor(private readonly serviceHistoryService: ServiceHistoryService) {}

  @Post('find-company-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '根据企业名称或统一社会信用代码查询服务历程记录' })
  @ApiResponse({ 
    status: 200, 
    description: '成功返回企业的服务历程记录，第一条返回完整记录，之后只返回变化的字段',
    type: [ServiceHistoryResponseDto]
  })
  async findCompanyHistory(@Body() findByCompanyDto: FindByCompanyDto) {
    return this.serviceHistoryService.findByCompanyNameOrCode({
      companyName: findByCompanyDto.companyName,
      unifiedSocialCreditCode: findByCompanyDto.unifiedSocialCreditCode
    });
  }
} 