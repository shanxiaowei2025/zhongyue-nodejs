import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExpenseContributionService } from './expense-contribution.service';
import { FindExpensesDto } from './dto/find-expenses.dto';
import { ExpenseSummaryDto } from './dto/expense-summary.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
 
@ApiTags('费用贡献')
@ApiBearerAuth()
@Controller('enterprise-service/expense-contribution')
export class ExpenseContributionController {
  constructor(private readonly expenseContributionService: ExpenseContributionService) {}

  @Get('find-company-expenses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '根据企业名称或统一社会信用代码查询费用记录' })
  @ApiResponse({ 
    status: 200, 
    description: '成功返回企业的费用记录和总费用',
    type: ExpenseSummaryDto
  })
  async findCompanyExpenses(@Query() findExpensesDto: FindExpensesDto): Promise<ExpenseSummaryDto> {
    return this.expenseContributionService.findExpensesByCompany(
      findExpensesDto.companyName,
      findExpensesDto.unifiedSocialCreditCode
    );
  }
} 