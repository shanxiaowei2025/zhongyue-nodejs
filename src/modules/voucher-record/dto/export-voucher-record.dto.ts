import { IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExportVoucherRecordDto {
  @ApiPropertyOptional({ description: '客户ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  customerIds?: number[];

  @ApiPropertyOptional({ description: '年度', example: 2024 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ description: '导出格式', enum: ['excel', 'csv'], default: 'excel' })
  @IsOptional()
  @IsString()
  format?: 'excel' | 'csv';

  @ApiPropertyOptional({ description: '记账会计筛选' })
  @IsOptional()
  @IsString()
  bookkeepingAccountant?: string;

  @ApiPropertyOptional({ description: '顾问会计筛选' })
  @IsOptional()
  @IsString()
  consultantAccountant?: string;

  @ApiPropertyOptional({ description: '是否包含月度详情', default: true })
  @IsOptional()
  includeMonthDetails?: boolean;
} 