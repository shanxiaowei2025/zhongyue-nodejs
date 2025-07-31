import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDepositDto {
  @ApiProperty({
    description: '页码',
    required: false,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: '每页记录数',
    required: false,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({
    description: '姓名（模糊查询）',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '扣除开始日期',
    required: false
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({
    description: '扣除结束日期',
    required: false
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
} 