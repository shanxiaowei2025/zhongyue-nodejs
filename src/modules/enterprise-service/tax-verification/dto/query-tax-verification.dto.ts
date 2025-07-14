import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTaxVerificationDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsString()
  @IsOptional()
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '所属分局', required: false })
  @IsString()
  @IsOptional()
  taxBureau?: string;

  @ApiProperty({ description: '风险下发日期开始', required: false })
  @IsDateString()
  @IsOptional()
  riskIssuedDateStart?: string;

  @ApiProperty({ description: '风险下发日期结束', required: false })
  @IsDateString()
  @IsOptional()
  riskIssuedDateEnd?: string;

  @ApiProperty({ description: '风险期责任会计', required: false })
  @IsString()
  @IsOptional()
  responsibleAccountant?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页条数', required: false, default: 10 })
  @Type(() => Number)
  @IsOptional()
  pageSize?: number = 10;
} 