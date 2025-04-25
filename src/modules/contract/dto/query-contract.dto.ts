import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryContractDto {
  @ApiPropertyOptional({ description: '关键词（合同编号或客户名称）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiPropertyOptional({ description: '客户名称' })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({ description: '合同状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDate()
  start_date?: Date;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDate()
  end_date?: Date;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number = 10;
} 