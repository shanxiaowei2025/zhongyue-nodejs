import { IsBoolean, IsDate, IsOptional, IsString, IsNumber } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuerySalaryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  type?: string;

  // 注意：company字段已从数据库中删除，如需公司查询功能，可考虑使用员工表中的payrollCompany字段
  // @ApiPropertyOptional({ description: '公司' })
  // @IsOptional()
  // @IsString()
  // company?: string;

  @ApiPropertyOptional({
    description: '是否已发放',
    type: 'boolean',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: '年月' })
  @IsOptional()
  @IsDate()
  yearMonth?: Date;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  // 数值字段范围筛选 - 基本工资
  @ApiPropertyOptional({ description: '基本工资最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseSalaryMin?: number;

  @ApiPropertyOptional({ description: '基本工资最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseSalaryMax?: number;

  // 考勤扣款
  @ApiPropertyOptional({ description: '考勤扣款最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  attendanceDeductionMin?: number;

  @ApiPropertyOptional({ description: '考勤扣款最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  attendanceDeductionMax?: number;

  // 临时增加
  @ApiPropertyOptional({ description: '临时增加最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temporaryIncreaseMin?: number;

  @ApiPropertyOptional({ description: '临时增加最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temporaryIncreaseMax?: number;

  // 全勤奖
  @ApiPropertyOptional({ description: '全勤奖最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fullAttendanceMin?: number;

  @ApiPropertyOptional({ description: '全勤奖最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fullAttendanceMax?: number;

  // 部门主管补贴
  @ApiPropertyOptional({ description: '部门主管补贴最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departmentHeadSubsidyMin?: number;

  @ApiPropertyOptional({ description: '部门主管补贴最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departmentHeadSubsidyMax?: number;

  // 职务津贴
  @ApiPropertyOptional({ description: '职务津贴最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  positionAllowanceMin?: number;

  @ApiPropertyOptional({ description: '职务津贴最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  positionAllowanceMax?: number;

  // 油费补贴
  @ApiPropertyOptional({ description: '油费补贴最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oilSubsidyMin?: number;

  @ApiPropertyOptional({ description: '油费补贴最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oilSubsidyMax?: number;

  // 餐费补贴
  @ApiPropertyOptional({ description: '餐费补贴最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mealSubsidyMin?: number;

  @ApiPropertyOptional({ description: '餐费补贴最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mealSubsidyMax?: number;

  // 工龄工资
  @ApiPropertyOptional({ description: '工龄工资最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  seniorityMin?: number;

  @ApiPropertyOptional({ description: '工龄工资最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  seniorityMax?: number;

  // 代理费提成
  @ApiPropertyOptional({ description: '代理费提成最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agencyFeeCommissionMin?: number;

  @ApiPropertyOptional({ description: '代理费提成最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agencyFeeCommissionMax?: number;

  // 绩效提成
  @ApiPropertyOptional({ description: '绩效提成最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  performanceCommissionMin?: number;

  @ApiPropertyOptional({ description: '绩效提成最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  performanceCommissionMax?: number;

  // 业务提成
  @ApiPropertyOptional({ description: '业务提成最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  businessCommissionMin?: number;

  @ApiPropertyOptional({ description: '业务提成最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  businessCommissionMax?: number;

  // 其他扣款
  @ApiPropertyOptional({ description: '其他扣款最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherDeductionsMin?: number;

  @ApiPropertyOptional({ description: '其他扣款最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherDeductionsMax?: number;

  // 个人保险合计
  @ApiPropertyOptional({ description: '个人保险合计最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalInsuranceTotalMin?: number;

  @ApiPropertyOptional({ description: '个人保险合计最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalInsuranceTotalMax?: number;

  // 公司保险合计
  @ApiPropertyOptional({ description: '公司保险合计最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyInsuranceTotalMin?: number;

  @ApiPropertyOptional({ description: '公司保险合计最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyInsuranceTotalMax?: number;

  // 押金扣款
  @ApiPropertyOptional({ description: '押金扣款最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depositDeductionMin?: number;

  @ApiPropertyOptional({ description: '押金扣款最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depositDeductionMax?: number;

  // 个人所得税
  @ApiPropertyOptional({ description: '个人所得税最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalIncomeTaxMin?: number;

  @ApiPropertyOptional({ description: '个人所得税最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalIncomeTaxMax?: number;

  // 应付合计
  @ApiPropertyOptional({ description: '应付合计最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPayableMin?: number;

  @ApiPropertyOptional({ description: '应付合计最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPayableMax?: number;

  // 银行卡/微信
  @ApiPropertyOptional({ description: '银行卡/微信最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bankCardOrWechatMin?: number;

  @ApiPropertyOptional({ description: '银行卡/微信最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bankCardOrWechatMax?: number;

  // 现金发放
  @ApiPropertyOptional({ description: '现金发放最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cashPaidMin?: number;

  @ApiPropertyOptional({ description: '现金发放最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cashPaidMax?: number;

  // 企业代付
  @ApiPropertyOptional({ description: '企业代付最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporatePaymentMin?: number;

  @ApiPropertyOptional({ description: '企业代付最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporatePaymentMax?: number;

  // 税务申报
  @ApiPropertyOptional({ description: '税务申报最小值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxDeclarationMin?: number;

  @ApiPropertyOptional({ description: '税务申报最大值', type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxDeclarationMax?: number;
}
