import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalaryBaseHistoryService } from './salary-base-history.service';
import { QuerySalaryBaseHistoryDto } from './dto/query-salary-base-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('薪资管理工资基数历程')
@Controller('salary-base-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalaryBaseHistoryController {
  constructor(private readonly salaryBaseHistoryService: SalaryBaseHistoryService) {}

  @Get()
  @ApiOperation({ summary: '查询工资基数历程记录' })
  @Roles('admin', 'super_admin')
  async findAll(@Query() query: QuerySalaryBaseHistoryDto) {
    return this.salaryBaseHistoryService.findAll(query);
  }
} 