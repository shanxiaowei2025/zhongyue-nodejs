import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '企业名称' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: '统一社会信用代码' })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiPropertyOptional({ description: '顾问会计' })
  @IsOptional()
  @IsString()
  consultantAccountant?: string;

  @ApiPropertyOptional({ description: '记账会计' })
  @IsOptional()
  @IsString()
  bookkeepingAccountant?: string;

  @ApiPropertyOptional({ description: '开票员' })
  @IsOptional()
  @IsString()
  invoiceOfficer?: string;

  @ApiPropertyOptional({ description: '企业类型' })
  @IsOptional()
  @IsString()
  enterpriseType?: string;

  @ApiPropertyOptional({ description: '归属地' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '所属分局' })
  @IsOptional()
  @IsString()
  taxBureau?: string;

  @ApiPropertyOptional({ description: '法人姓名' })
  @IsOptional()
  @IsString()
  legalRepresentativeName?: string;

  @ApiPropertyOptional({ description: '企业当前经营状态' })
  @IsOptional()
  @IsString()
  enterpriseStatus?: string;

  @ApiPropertyOptional({ description: '客户分级' })
  @IsOptional()
  @IsString()
  customerLevel?: string;
}
