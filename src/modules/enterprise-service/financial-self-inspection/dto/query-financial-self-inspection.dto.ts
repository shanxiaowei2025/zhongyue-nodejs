import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFinancialSelfInspectionDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '记账会计', required: false })
  @IsOptional()
  @IsString()
  bookkeepingAccountant?: string;

  @ApiProperty({ description: '顾问会计', required: false })
  @IsOptional()
  @IsString()
  consultantAccountant?: string;

  @ApiProperty({ description: '抽查人', required: false })
  @IsOptional()
  @IsString()
  inspector?: string;

  @ApiProperty({ description: '复查人', required: false })
  @IsOptional()
  @IsString()
  reviewer?: string;
  
  @ApiProperty({ 
    description: '状态(0：已提交未整改 1：已整改 2：抽查人确认 3：抽查人退回 4：复查人确认 5：复查人退回)', 
    required: false,
    enum: [0, 1, 2, 3, 4, 5]
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '抽查日期开始', required: false })
  @IsOptional()
  @IsDateString()
  inspectionDateStart?: string;

  @ApiProperty({ description: '抽查日期结束', required: false })
  @IsOptional()
  @IsDateString()
  inspectionDateEnd?: string;

  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
} 