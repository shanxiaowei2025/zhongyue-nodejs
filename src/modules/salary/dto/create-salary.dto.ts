import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalaryDto {
  @IsNotEmpty({ message: '部门不能为空' })
  @IsString()
  department: string;

  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '身份证号不能为空' })
  @IsString()
  idCard: string;

  @IsNotEmpty({ message: '类型不能为空' })
  @IsString()
  type: string;

  @IsNumber()
  @IsOptional()
  baseSalary: number;

  @IsNumber()
  @IsOptional()
  temporaryIncrease: number;
  
  @IsString()
  @IsOptional()
  temporaryIncreaseItem: string;

  @IsNumber()
  @IsOptional()
  attendanceDeduction: number;

  @IsNumber()
  @IsOptional()
  basicSalaryPayable: number;

  @IsNumber()
  @IsOptional()
  fullAttendance: number;

  @IsNumber()
  @IsOptional()
  totalSubsidy: number;

  @IsNumber()
  @IsOptional()
  seniority: number;

  @IsNumber()
  @IsOptional()
  agencyFeeCommission: number;

  @IsNumber()
  @IsOptional()
  performanceCommission: number;

  @IsOptional()
  performanceDeductions: number[];

  @IsNumber()
  @IsOptional()
  businessCommission: number;

  @IsNumber()
  @IsOptional()
  otherDeductions: number;

  @IsNumber()
  @IsOptional()
  personalMedical: number;

  @IsNumber()
  @IsOptional()
  personalPension: number;

  @IsNumber()
  @IsOptional()
  personalUnemployment: number;

  @IsNumber()
  @IsOptional()
  personalInsuranceTotal: number;

  @IsNumber()
  @IsOptional()
  companyInsuranceTotal: number;

  @IsNumber()
  @IsOptional()
  depositDeduction: number;

  @IsNumber()
  @IsOptional()
  personalIncomeTax: number;

  @IsNumber()
  @IsOptional()
  other: number;

  @IsNumber()
  @IsOptional()
  totalPayable: number;

  @IsString()
  @IsOptional()
  bankCardNumber: string;

  // 注意：company字段已从数据库中删除，改用员工表中的payrollCompany字段
  // @IsString()
  // @IsOptional()
  // company: string;

  @IsNumber()
  @IsOptional()
  bankCardOrWechat: number;

  @IsNumber()
  @IsOptional()
  cashPaid: number;

  @IsNumber()
  @IsOptional()
  corporatePayment: number;

  @IsNumber()
  @IsOptional()
  taxDeclaration: number;

  @ApiProperty({ 
    description: '是否已发放', 
    type: 'boolean',
    required: false,
    default: false,
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isPaid: boolean;

  @ApiProperty({ 
    description: '是否已确认', 
    type: 'boolean',
    required: false,
    default: false,
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isConfirmed: boolean;

  @ApiProperty({
    description: '确认时间',
    required: false,
    type: Date
  })
  @IsDate()
  @IsOptional()
  confirmedAt: Date;

  @IsNotEmpty({ message: '年月不能为空' })
  @IsDate()
  yearMonth: Date;
}
