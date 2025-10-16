import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSalaryDto {
  @ApiProperty({
    description: '底薪临时增加金额',
    type: 'number',
    required: false,
    example: 1200,
  })
  @IsNumber()
  @IsOptional()
  temporaryIncrease?: number;

  @ApiProperty({
    description: '临时增加项目',
    type: 'string',
    required: false,
    example: '加班费',
  })
  @IsString()
  @IsOptional()
  temporaryIncreaseItem?: string;

  @ApiProperty({
    description: '考勤扣款',
    type: 'number',
    required: false,
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  attendanceDeduction?: number;

  // ❌ 移除：应发基本工资 - 这是自动计算字段
  // basicSalaryPayable?: number;

  @ApiProperty({
    description: '全勤',
    type: 'number',
    required: false,
    example: 300,
  })
  @IsNumber()
  @IsOptional()
  fullAttendance?: number;

  @ApiProperty({
    description: '部门负责人补贴',
    type: 'number',
    required: false,
    example: 200,
  })
  @IsNumber()
  @IsOptional()
  departmentHeadSubsidy?: number;

  @ApiProperty({
    description: '岗位津贴',
    type: 'number',
    required: false,
    example: 150,
  })
  @IsNumber()
  @IsOptional()
  positionAllowance?: number;

  @ApiProperty({
    description: '油补',
    type: 'number',
    required: false,
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  oilSubsidy?: number;

  @ApiProperty({
    description: '餐补',
    type: 'number',
    required: false,
    example: 50,
  })
  @IsNumber()
  @IsOptional()
  mealSubsidy?: number;

  @ApiProperty({
    description: '工龄',
    type: 'number',
    required: false,
    example: 200,
  })
  @IsNumber()
  @IsOptional()
  seniority?: number;

  @ApiProperty({
    description: '代理费提成',
    type: 'number',
    required: false,
    example: 800,
  })
  @IsNumber()
  @IsOptional()
  agencyFeeCommission?: number;

  @ApiProperty({
    description: '绩效提成',
    type: 'number',
    required: false,
    example: 2500,
  })
  @IsNumber()
  @IsOptional()
  performanceCommission?: number;

  @ApiProperty({
    description: '绩效扣除',
    type: 'array',
    items: { type: 'number' },
    required: false,
    example: [100, 50],
  })
  @IsArray()
  @IsOptional()
  performanceDeductions?: number[];

  @ApiProperty({
    description: '业务提成',
    type: 'number',
    required: false,
    example: 1000,
  })
  @IsNumber()
  @IsOptional()
  businessCommission?: number;

  @ApiProperty({
    description: '其他扣款',
    type: 'number',
    required: false,
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  otherDeductions?: number;

  @ApiProperty({
    description: '个人医疗',
    type: 'number',
    required: false,
    example: 120,
  })
  @IsNumber()
  @IsOptional()
  personalMedical?: number;

  @ApiProperty({
    description: '个人养老',
    type: 'number',
    required: false,
    example: 450,
  })
  @IsNumber()
  @IsOptional()
  personalPension?: number;

  @ApiProperty({
    description: '个人失业',
    type: 'number',
    required: false,
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  personalUnemployment?: number;

  @ApiProperty({
    description: '社保个人合计',
    type: 'number',
    required: false,
    example: 600,
  })
  @IsNumber()
  @IsOptional()
  personalInsuranceTotal?: number;

  @ApiProperty({
    description: '公司承担合计',
    type: 'number',
    required: false,
    example: 800,
  })
  @IsNumber()
  @IsOptional()
  companyInsuranceTotal?: number;

  @ApiProperty({
    description: '保证金扣除',
    type: 'number',
    required: false,
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  depositDeduction?: number;

  @ApiProperty({
    description: '个税',
    type: 'number',
    required: false,
    example: 150,
  })
  @IsNumber()
  @IsOptional()
  personalIncomeTax?: number;

  @ApiProperty({
    description: '其他',
    type: 'number',
    required: false,
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  other?: number;

  // ❌ 移除：应发合计 - 这是自动计算字段
  // totalPayable?: number;

  @ApiProperty({
    description: '银行卡号',
    type: 'string',
    required: false,
    example: '6217000010012345678',
  })
  @IsString()
  @IsOptional()
  bankCardNumber?: string;

  // 注意：company字段已从数据库中删除，改用员工表中的payrollCompany字段
  // @IsString()
  // @IsOptional()
  // company: string;

  @ApiProperty({
    description: '银行卡/微信',
    type: 'number',
    required: false,
    example: 12000,
  })
  @IsNumber()
  @IsOptional()
  bankCardOrWechat?: number;

  // ❌ 移除：对公 - 这是自动计算字段
  // corporatePayment?: number;

  // ❌ 移除：个税申报 - 这是自动计算字段
  // taxDeclaration?: number;

  @ApiProperty({
    description: '是否已发放',
    type: 'boolean',
    required: false,
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({
    description: '是否已确认',
    type: 'boolean',
    required: false,
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;

  @ApiProperty({
    description: '确认时间',
    required: false,
    type: Date,
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  confirmedAt?: Date;
}
