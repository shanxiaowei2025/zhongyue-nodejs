import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLevelHistoryDto {
  @ApiProperty({ description: '客户ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '客户ID必须是数字' })
  customerId?: number;

  @ApiProperty({ description: '企业名称（模糊查询）', required: false })
  @IsOptional()
  @IsString({ message: '企业名称必须是字符串' })
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsOptional()
  @IsString({ message: '统一社会信用代码必须是字符串' })
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '开始日期', example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString({}, { message: '开始日期格式不正确' })
  startDate?: string;

  @ApiProperty({ description: '结束日期', example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString({}, { message: '结束日期格式不正确' })
  endDate?: string;

  @ApiProperty({ description: '客户等级筛选', required: false })
  @IsOptional()
  @IsString({ message: '客户等级必须是字符串' })
  currentLevel?: string;

  @ApiProperty({ description: '操作人员', required: false })
  @IsOptional()
  @IsString({ message: '操作人员必须是字符串' })
  changedBy?: string;

  @ApiProperty({ description: '页码', example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码最小为1' })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量最小为1' })
  @Max(100, { message: '每页数量最大为100' })
  limit?: number = 10;
} 