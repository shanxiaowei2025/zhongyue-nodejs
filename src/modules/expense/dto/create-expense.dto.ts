import { IsString, IsNumber, IsOptional, IsArray, IsDateString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '企业类型', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ description: '企业归属地', required: false })
  @IsOptional()
  @IsString()
  companyLocation?: string;

  @ApiProperty({ description: '办照类型', required: false })
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiProperty({ description: '办照费用', required: false })
  @IsOptional()
  @IsNumber()
  licenseFee?: number;

  // @ApiProperty({ description: '一次性地址费', required: false })
  // @IsOptional()
  // @IsNumber()
  // oneTimeAddressFee?: number;

  @ApiProperty({ description: '牌子费', required: false })
  @IsOptional()
  @IsNumber()
  brandFee?: number;

  // @ApiProperty({ description: '刻章费', required: false })
  // @IsOptional()
  // @IsNumber()
  // sealFee?: number;
  
  @ApiProperty({ description: '备案章费用', required: false })
  @IsOptional()
  @IsNumber()
  recordSealFee?: number;
  
  @ApiProperty({ description: '一般刻章费用', required: false })
  @IsOptional()
  @IsNumber()
  generalSealFee?: number;

  @ApiProperty({ description: '代理类型', required: false })
  @IsOptional()
  @IsString()
  agencyType?: string;

  @ApiProperty({ description: '代理费', required: false })
  @IsOptional()
  @IsNumber()
  agencyFee?: number;

  @ApiProperty({ description: '记账软件费', required: false })
  @IsOptional()
  @IsNumber()
  accountingSoftwareFee?: number;

  @ApiProperty({ description: '记账软件开始日期', required: false })
  @IsOptional()
  @IsString()
  accountingSoftwareStartDate?: string;

  @ApiProperty({ description: '记账软件结束日期', required: false })
  @IsOptional()
  @IsString()
  accountingSoftwareEndDate?: string;

  @ApiProperty({ description: '地址费', required: false })
  @IsOptional()
  @IsNumber()
  addressFee?: number;

  @ApiProperty({ description: '地址费开始日期', required: false })
  @IsOptional()
  @IsString()
  addressStartDate?: string;

  @ApiProperty({ description: '地址费结束日期', required: false })
  @IsOptional()
  @IsString()
  addressEndDate?: string;

  @ApiProperty({ description: '代理开始日期', required: false })
  @IsOptional()
  @IsString()
  agencyStartDate?: string;

  @ApiProperty({ description: '代理结束日期', required: false })
  @IsOptional()
  @IsString()
  agencyEndDate?: string;

  @ApiProperty({ description: '业务类型', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ description: '合同类型', required: false })
  @IsOptional()
  @IsString()
  contractType?: string;

  @ApiProperty({ description: '合同图片列表', required: false, type: [Object] })
  @IsOptional()
  @IsArray()
  contractImage?: any[];

  @ApiProperty({ 
    description: '关联合同', 
    required: false, 
    type: 'array',
    example: [
      { id: 4, contractNumber: '2025052600003' },
      { id: 5, contractNumber: '2025052600006' }
    ]
  })
  @IsOptional()
  @IsArray()
  relatedContract?: Array<{ id: number, contractNumber: string }>;

  // @ApiProperty({ description: '开票软件服务商', required: false })
  // @IsOptional()
  // @IsString()
  // invoiceSoftwareProvider?: string;

  @ApiProperty({ description: '开票软件费', required: false })
  @IsOptional()
  @IsNumber()
  invoiceSoftwareFee?: number;

  @ApiProperty({ description: '开票软件开始日期', required: false })
  @IsOptional()
  @IsString()
  invoiceSoftwareStartDate?: string;

  @ApiProperty({ description: '开票软件结束日期', required: false })
  @IsOptional()
  @IsString()
  invoiceSoftwareEndDate?: string;

  @ApiProperty({ description: '参保险种', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  insuranceTypes?: string[];

  @ApiProperty({ description: '参保人数', required: false })
  @IsOptional()
  @IsNumber()
  insuredCount?: number;

  @ApiProperty({ description: '社保代理费', required: false })
  @IsOptional()
  @IsNumber()
  socialInsuranceAgencyFee?: number;

  @ApiProperty({ description: '社保开始日期', required: false })
  @IsOptional()
  @IsString()
  socialInsuranceStartDate?: string;

  @ApiProperty({ description: '社保结束日期', required: false })
  @IsOptional()
  @IsString()
  socialInsuranceEndDate?: string;

  @ApiProperty({ description: '是否有公积金', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  hasHousingFund?: boolean;
  
  @ApiProperty({ description: '公积金人数', required: false })
  @IsOptional()
  @IsNumber()
  housingFundCount?: number;
  
  @ApiProperty({ description: '公积金代理费', required: false })
  @IsOptional()
  @IsNumber()
  housingFundAgencyFee?: number;
  
  @ApiProperty({ description: '公积金开始日期', required: false })
  @IsOptional()
  @IsString()
  housingFundStartDate?: string;
  
  @ApiProperty({ description: '公积金结束日期', required: false })
  @IsOptional()
  @IsString()
  housingFundEndDate?: string;

  @ApiProperty({ description: '统计局报表费', required: false })
  @IsOptional()
  @IsNumber()
  statisticalReportFee?: number;

  @ApiProperty({ description: '统计开始日期', required: false })
  @IsOptional()
  @IsString()
  statisticalStartDate?: string;

  @ApiProperty({ description: '统计结束日期', required: false })
  @IsOptional()
  @IsString()
  statisticalEndDate?: string;

  @ApiProperty({ description: '变更业务', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  changeBusiness?: string[];

  @ApiProperty({ description: '变更收费', required: false })
  @IsOptional()
  @IsNumber()
  changeFee?: number;

  @ApiProperty({ description: '行政许可', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  administrativeLicense?: string[];

  @ApiProperty({ description: '行政许可收费', required: false })
  @IsOptional()
  @IsNumber()
  administrativeLicenseFee?: number;

  @ApiProperty({ description: '其他业务', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherBusiness?: string[];

  @ApiProperty({ description: '其他业务收费', required: false })
  @IsOptional()
  @IsNumber()
  otherBusinessFee?: number;

  @ApiProperty({ description: '收费凭证', required: false })
  @IsOptional()
  @IsArray()
  proofOfCharge?: string[];

  @ApiProperty({ description: '总费用', required: false })
  @IsOptional()
  @IsNumber()
  totalFee?: number;

  @ApiProperty({ description: '业务员', required: false })
  @IsOptional()
  @IsString()
  salesperson?: string;

  @ApiProperty({ description: '收费日期', required: false })
  @IsOptional()
  @IsString()
  chargeDate?: string;

  @ApiProperty({ description: '收据编号', required: false })
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @ApiProperty({ description: '收费方式', required: false })
  @IsOptional()
  @IsString()
  chargeMethod?: string;

  @ApiProperty({ description: '收据备注', required: false })
  @IsOptional()
  @IsString()
  receiptRemarks?: string;
  
  @ApiProperty({ description: '内部备注', required: false })
  @IsOptional()
  @IsString()
  internalRemarks?: string;
} 