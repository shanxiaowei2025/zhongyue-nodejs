import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDate, IsArray, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractDto {
  @ApiProperty({ description: '签署方', required: false })
  @IsString()
  @IsOptional()
  signatory?: string;
  
  @ApiProperty({ description: '合同类型', required: false })
  @IsString()
  @IsOptional()
  contractType?: string;
  
  @ApiProperty({ description: '甲方公司', required: false })
  @IsString()
  @IsOptional()
  partyACompany?: string;
  
  @ApiProperty({ description: '甲方统一社会信用代码', required: false })
  @IsString()
  @IsOptional()
  partyACreditCode?: string;
  
  @ApiProperty({ description: '甲方法人', required: false })
  @IsString()
  @IsOptional()
  partyALegalPerson?: string;
  
  @ApiProperty({ description: '甲方邮编', required: false })
  @IsString()
  @IsOptional()
  partyAPostalCode?: string;
  
  @ApiProperty({ description: '甲方通讯地址', required: false })
  @IsString()
  @IsOptional()
  partyAAddress?: string;
  
  @ApiProperty({ description: '甲方联系人', required: false })
  @IsString()
  @IsOptional()
  partyAContact?: string;
  
  @ApiProperty({ description: '甲方联系电话', required: false })
  @IsString()
  @IsOptional()
  partyAPhone?: string;
  
  @ApiProperty({ description: '乙方公司', required: false })
  @IsString()
  @IsOptional()
  partyBCompany?: string;
  
  @ApiProperty({ description: '乙方统一社会信用代码', required: false })
  @IsString()
  @IsOptional()
  partyBCreditCode?: string;
  
  @ApiProperty({ description: '乙方法人', required: false })
  @IsString()
  @IsOptional()
  partyBLegalPerson?: string;
  
  @ApiProperty({ description: '乙方邮编', required: false })
  @IsString()
  @IsOptional()
  partyBPostalCode?: string;
  
  @ApiProperty({ description: '乙方通讯地址', required: false })
  @IsString()
  @IsOptional()
  partyBAddress?: string;
  
  @ApiProperty({ description: '乙方联系人', required: false })
  @IsString()
  @IsOptional()
  partyBContact?: string;
  
  @ApiProperty({ description: '乙方联系电话', required: false })
  @IsString()
  @IsOptional()
  partyBPhone?: string;
  
  @ApiProperty({ description: '咨询电话', required: false })
  @IsString()
  @IsOptional()
  consultPhone?: string;
  
  @ApiProperty({ description: '工商-设立', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  businessEstablishment?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '工商-设立地址', required: false })
  @IsString()
  @IsOptional()
  businessEstablishmentAddress?: string;
  
  @ApiProperty({ description: '工商-变更', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  businessChange?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '工商-注销', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  businessCancellation?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '工商-其他', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  businessOther?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '工商-物料', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  businessMaterials?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '工商-备注', required: false })
  @IsString()
  @IsOptional()
  businessRemark?: string;
  
  @ApiProperty({ description: '工商-服务费', required: false })
  @IsNumber()
  @IsOptional()
  businessServiceFee?: number;
  
  @ApiProperty({ description: '税务', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  taxMatters?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '税务-备注', required: false })
  @IsString()
  @IsOptional()
  taxRemark?: string;
  
  @ApiProperty({ description: '税务-服务费', required: false })
  @IsNumber()
  @IsOptional()
  taxServiceFee?: number;
  
  @ApiProperty({ description: '银行', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  bankMatters?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '银行-备注', required: false })
  @IsString()
  @IsOptional()
  bankRemark?: string;
  
  @ApiProperty({ description: '银行-服务费', required: false })
  @IsNumber()
  @IsOptional()
  bankServiceFee?: number;
  
  @ApiProperty({ description: '社保', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  socialSecurity?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '社保-备注', required: false })
  @IsString()
  @IsOptional()
  socialSecurityRemark?: string;
  
  @ApiProperty({ description: '社保-服务费', required: false })
  @IsNumber()
  @IsOptional()
  socialSecurityServiceFee?: number;
  
  @ApiProperty({ description: '许可业务', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  licenseBusiness?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '许可-备注', required: false })
  @IsString()
  @IsOptional()
  licenseRemark?: string;
  
  @ApiProperty({ description: '许可-服务费', required: false })
  @IsNumber()
  @IsOptional()
  licenseServiceFee?: number;
  
  @ApiProperty({ description: '其他-备注', required: false })
  @IsString()
  @IsOptional()
  otherRemark?: string;
  
  @ApiProperty({ description: '其他-服务费', required: false })
  @IsNumber()
  @IsOptional()
  otherServiceFee?: number;
  
  @ApiProperty({ description: '费用总计', required: false })
  @IsNumber()
  @IsOptional()
  totalCost?: number;
  
  @ApiProperty({ description: '甲方盖章图片', required: false })
  @IsString()
  @IsOptional()
  partyAStampImage?: string;
  
  @ApiProperty({ description: '甲方签订日期', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  partyASignDate?: Date;
  
  @ApiProperty({ description: '乙方签订日期', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  partyBSignDate?: Date;
  
  @ApiProperty({ description: '委托开始日期', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  entrustmentStartDate?: Date;
  
  @ApiProperty({ description: '委托结束日期', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  entrustmentEndDate?: Date;
  
  @ApiProperty({ description: '申报服务', required: false, type: 'array' })
  @IsArray()
  @Type(() => Object)
  @IsOptional()
  declarationService?: Array<Record<string, any>>;
  
  @ApiProperty({ description: '其他业务', required: false })
  @IsString()
  @IsOptional()
  otherBusiness?: string;
  
  @ApiProperty({ description: '代理记账总费用', required: false })
  @IsNumber()
  @IsOptional()
  totalAgencyAccountingFee?: number;
  
  @ApiProperty({ description: '代理记账费', required: false })
  @IsNumber()
  @IsOptional()
  agencyAccountingFee?: number;
  
  @ApiProperty({ description: '记账软件费', required: false })
  @IsNumber()
  @IsOptional()
  accountingSoftwareFee?: number;
  
  @ApiProperty({ description: '开票软件费', required: false })
  @IsNumber()
  @IsOptional()
  invoicingSoftwareFee?: number;
  
  @ApiProperty({ description: '账簿费', required: false })
  @IsNumber()
  @IsOptional()
  accountBookFee?: number;
  
  @ApiProperty({ description: '支付方式', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
  
  @ApiProperty({ description: '合同状态', required: false, enum: ['0', '1', '2'], example: '0' })
  @IsString()
  @IsOptional()
  contractStatus?: string;
  
  @ApiProperty({ description: '备注信息', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
} 