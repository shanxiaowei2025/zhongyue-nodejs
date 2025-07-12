import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryExpenseDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiProperty({
    description: '状态：0-未审核，1-已审核，2-已退回',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '业务员', required: false })
  @IsOptional()
  @IsString()
  salesperson?: string;

  @ApiProperty({ description: '收费开始日期', required: false })
  @IsOptional()
  @IsDateString()
  chargeDateStart?: string;

  @ApiProperty({ description: '收费结束日期', required: false })
  @IsOptional()
  @IsDateString()
  chargeDateEnd?: string;

  @ApiProperty({ description: '企业类型', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ description: '企业所在地', required: false })
  @IsOptional()
  @IsString()
  companyLocation?: string;

  @ApiProperty({ description: '业务类型', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ description: '支付方式', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ description: '服务期限', required: false })
  @IsOptional()
  @IsString()
  servicePeriod?: string;

  @ApiProperty({ description: '收据编号', required: false })
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @ApiProperty({ description: '审核人', required: false })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiProperty({ description: '收款人', required: false })
  @IsOptional()
  @IsString()
  payee?: string;

  // 保留原有的分页参数
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 10;
}
