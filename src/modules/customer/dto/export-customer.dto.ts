import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportCustomerDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '顾问会计', required: false })
  @IsOptional()
  @IsString()
  consultantAccountant?: string;

  @ApiProperty({ description: '记账会计', required: false })
  @IsOptional()
  @IsString()
  bookkeepingAccountant?: string;

  @ApiProperty({ description: '企业所属的税务分局', required: false })
  @IsOptional()
  @IsString()
  taxBureau?: string;

  @ApiProperty({ description: '企业类型', required: false })
  @IsOptional()
  @IsString()
  enterpriseType?: string;

  @ApiProperty({ description: '行业大类', required: false })
  @IsOptional()
  @IsString()
  industryCategory?: string;

  @ApiProperty({ description: '企业当前的经营状态', required: false })
  @IsOptional()
  @IsString()
  enterpriseStatus?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
  
  @ApiProperty({ description: '归属地', required: false })
  @IsOptional()
  @IsString()
  location?: string;
} 