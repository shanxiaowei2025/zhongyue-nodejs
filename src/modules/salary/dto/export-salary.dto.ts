import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ExportSalaryDto {
  @ApiProperty({ description: '部门（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: '姓名（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '身份证号（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  idCard?: string;

  @ApiProperty({ description: '类型（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: '发薪公司（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ 
    description: '年月（支持 YYYY-MM 或 YYYY-MM-DD 格式）', 
    required: false, 
    example: '2025-06' 
  })
  @IsOptional()
  @IsString()
  yearMonth?: string;

  @ApiProperty({
    description: '开始日期（筛选年月范围）',
    required: false,
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '结束日期（筛选年月范围）',
    required: false,
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '是否已发放',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({
    description: '是否已确认',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isConfirmed?: boolean;
} 