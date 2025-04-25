import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';

// 定义业务类型枚举
export enum BusinessType {
  ACCOUNTING = '代理记账合同',
  SOCIAL_INSURANCE = '社保代理合同'
}

// 定义合同状态枚举
export enum ContractStatus {
  UNSIGNED = '未签署',
  ACTIVE = '生效中',
  EXPIRED = '已过期',
  VOID = '已作废'
}

export class CreateContractDto {
  @ApiProperty({ description: '合同编号' })
  @IsString()
  contract_no: string;

  @ApiProperty({ 
    description: '业务类型',
    enum: BusinessType,
    example: BusinessType.ACCOUNTING
  })
  @IsEnum(BusinessType, { message: '业务类型必须是: 代理记账合同 或 社保代理合同' })
  business_type: BusinessType;

  @ApiProperty({ description: '客户名称' })
  @IsString()
  customer_name: string;

  @ApiProperty({ description: '客户统一社会信用代码' })
  @IsString()
  customer_code: string;

  @ApiProperty({ description: '客户地址' })
  @IsString()
  customer_address: string;

  @ApiProperty({ description: '客户电话' })
  @IsString()
  customer_phone: string;

  @ApiProperty({ description: '客户联系人' })
  @IsString()
  customer_contact: string;

  @ApiProperty({ description: '公司名称' })
  @IsString()
  company_name: string;

  @ApiProperty({ description: '公司统一社会信用代码' })
  @IsString()
  company_code: string;

  @ApiProperty({ description: '公司地址' })
  @IsString()
  company_address: string;

  @ApiProperty({ description: '公司电话' })
  @IsString()
  company_phone: string;

  @ApiProperty({ description: '业务人员' })
  @IsString()
  business_person: string;

  @ApiProperty({ description: '合同金额' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '签订日期', example: '2025-01-30' })
  @IsDateString()
  sign_date: string;

  @ApiProperty({ description: '开始日期', example: '2025-01-17' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: '到期日期', example: '2025-01-25' })
  @IsDateString()
  expire_date: string;

  @ApiProperty({ 
    description: '合同状态', 
    enum: ContractStatus,
    default: ContractStatus.UNSIGNED
  })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiProperty({ description: '备注信息' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({ description: '合同文件URL列表' })
  @IsArray()
  contract_files: string[];

  @ApiProperty({ description: '提交人' })
  @IsString()
  @IsOptional()
  submitter?: string;
}