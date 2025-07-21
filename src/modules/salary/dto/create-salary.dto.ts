import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsOptional()
  company: string;

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

  @IsNotEmpty({ message: '年月不能为空' })
  @IsDate()
  yearMonth: Date;
}
