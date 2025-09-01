import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryStatusHistoryDto {
  @ApiProperty({ description: '客户ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '客户ID必须是数字' })
  customerId?: number;

  @ApiProperty({ description: '企业名称（模糊查询）', required: false })
  @IsOptional()
  @IsString({ message: '企业名称必须是字符串' })
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码（模糊查询）', required: false })
  @IsOptional()
  @IsString({ message: '统一社会信用代码必须是字符串' })
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '当前企业状态', required: false })
  @IsOptional()
  @IsString({ message: '企业状态必须是字符串' })
  currentEnterpriseStatus?: string;

  @ApiProperty({ description: '当前业务状态', required: false })
  @IsOptional()
  @IsString({ message: '业务状态必须是字符串' })
  currentBusinessStatus?: string;

  @ApiProperty({ description: '开始日期', example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString({}, { message: '开始日期格式不正确' })
  startDate?: string;

  @ApiProperty({ description: '结束日期', example: '2025-01-31', required: false })
  @IsOptional()
  @IsDateString({}, { message: '结束日期格式不正确' })
  endDate?: string;

  @ApiProperty({ description: '操作人员', required: false })
  @IsOptional()
  @IsString({ message: '操作人员必须是字符串' })
  changedBy?: string;

  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiProperty({ description: '每页条数', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页条数必须是数字' })
  @Min(1, { message: '每页条数必须大于0' })
  limit?: number = 10;
} 