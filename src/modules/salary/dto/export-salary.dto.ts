import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ExportSalaryDto {
  @ApiProperty({ description: '部门（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: '姓名（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '类型（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: '年月（支持 YYYY-MM 或 YYYY-MM-DD 格式）',
    required: false,
    example: '2025-06',
  })
  @IsOptional()
  @IsString()
  yearMonth?: string;

  @ApiProperty({
    description: '开始日期（筛选年月范围）',
    required: false,
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '结束日期（筛选年月范围）',
    required: false,
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '是否已发放',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({
    description: '是否已确认',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isConfirmed?: boolean;

  // 数值字段范围筛选 - 基本工资
  @ApiProperty({ description: '基本工资最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseSalaryMin?: number;

  @ApiProperty({ description: '基本工资最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseSalaryMax?: number;

  // 考勤扣款
  @ApiProperty({ description: '考勤扣款最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  attendanceDeductionMin?: number;

  @ApiProperty({ description: '考勤扣款最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  attendanceDeductionMax?: number;

  // 临时增加
  @ApiProperty({ description: '临时增加最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temporaryIncreaseMin?: number;

  @ApiProperty({ description: '临时增加最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temporaryIncreaseMax?: number;

  // 全勤奖
  @ApiProperty({ description: '全勤奖最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fullAttendanceMin?: number;

  @ApiProperty({ description: '全勤奖最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fullAttendanceMax?: number;

  // 部门主管补贴
  @ApiProperty({ description: '部门主管补贴最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departmentHeadSubsidyMin?: number;

  @ApiProperty({ description: '部门主管补贴最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departmentHeadSubsidyMax?: number;

  // 职务津贴
  @ApiProperty({ description: '职务津贴最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  positionAllowanceMin?: number;

  @ApiProperty({ description: '职务津贴最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  positionAllowanceMax?: number;

  // 油费补贴
  @ApiProperty({ description: '油费补贴最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oilSubsidyMin?: number;

  @ApiProperty({ description: '油费补贴最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oilSubsidyMax?: number;

  // 餐费补贴
  @ApiProperty({ description: '餐费补贴最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mealSubsidyMin?: number;

  @ApiProperty({ description: '餐费补贴最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mealSubsidyMax?: number;

  // 工龄工资
  @ApiProperty({ description: '工龄工资最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  seniorityMin?: number;

  @ApiProperty({ description: '工龄工资最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  seniorityMax?: number;

  // 代理费提成
  @ApiProperty({ description: '代理费提成最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agencyFeeCommissionMin?: number;

  @ApiProperty({ description: '代理费提成最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agencyFeeCommissionMax?: number;

  // 绩效提成
  @ApiProperty({ description: '绩效提成最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  performanceCommissionMin?: number;

  @ApiProperty({ description: '绩效提成最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  performanceCommissionMax?: number;

  // 业务提成
  @ApiProperty({ description: '业务提成最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  businessCommissionMin?: number;

  @ApiProperty({ description: '业务提成最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  businessCommissionMax?: number;

  // 其他扣款
  @ApiProperty({ description: '其他扣款最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherDeductionsMin?: number;

  @ApiProperty({ description: '其他扣款最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherDeductionsMax?: number;

  // 个人保险合计
  @ApiProperty({ description: '个人保险合计最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalInsuranceTotalMin?: number;

  @ApiProperty({ description: '个人保险合计最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalInsuranceTotalMax?: number;

  // 公司保险合计
  @ApiProperty({ description: '公司保险合计最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyInsuranceTotalMin?: number;

  @ApiProperty({ description: '公司保险合计最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyInsuranceTotalMax?: number;

  // 押金扣款
  @ApiProperty({ description: '押金扣款最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depositDeductionMin?: number;

  @ApiProperty({ description: '押金扣款最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depositDeductionMax?: number;

  // 个人所得税
  @ApiProperty({ description: '个人所得税最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalIncomeTaxMin?: number;

  @ApiProperty({ description: '个人所得税最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  personalIncomeTaxMax?: number;

  // 应付合计
  @ApiProperty({ description: '应付合计最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPayableMin?: number;

  @ApiProperty({ description: '应付合计最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPayableMax?: number;

  // 银行卡/微信
  @ApiProperty({ description: '银行卡/微信最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bankCardOrWechatMin?: number;

  @ApiProperty({ description: '银行卡/微信最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bankCardOrWechatMax?: number;

  // 现金发放
  @ApiProperty({ description: '现金发放最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cashPaidMin?: number;

  @ApiProperty({ description: '现金发放最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cashPaidMax?: number;

  // 企业代付
  @ApiProperty({ description: '企业代付最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporatePaymentMin?: number;

  @ApiProperty({ description: '企业代付最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporatePaymentMax?: number;

  // 税务申报
  @ApiProperty({ description: '税务申报最小值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxDeclarationMin?: number;

  @ApiProperty({ description: '税务申报最大值', required: false, type: 'number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxDeclarationMax?: number;
}
