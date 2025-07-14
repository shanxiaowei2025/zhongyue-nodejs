import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalaryBaseHistoryService } from './salary-base-history.service';
import { QuerySalaryBaseHistoryDto } from './dto/query-salary-base-history.dto';

@ApiTags('薪资管理工资基数历程')
@Controller('salary-base-history')
export class SalaryBaseHistoryController {
  constructor(private readonly salaryBaseHistoryService: SalaryBaseHistoryService) {}

  @Get()
  @ApiOperation({ summary: '查询工资基数历程记录' })
  async findAll(@Query() query: QuerySalaryBaseHistoryDto) {
    return this.salaryBaseHistoryService.findAll(query);
  }
} 