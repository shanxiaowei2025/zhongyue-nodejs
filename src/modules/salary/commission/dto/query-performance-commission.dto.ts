import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPerformanceCommissionDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页记录数', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({ description: '提成类型', required: false })
  @IsOptional()
  @IsString()
  commissionType?: string;

  @ApiProperty({ description: '职位', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ description: 'P级', example: 'P1', required: false })
  @IsOptional()
  @IsString()
  pLevel?: string;

  @ApiProperty({ description: '档级', example: '一档', required: false })
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiProperty({ description: '户数', example: '1-5户', required: false })
  @IsOptional()
  @IsString()
  householdCount?: string;

  @ApiProperty({ description: '底薪(元)', example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiProperty({ description: '绩效(元)', example: 3000, required: false })
  @IsOptional()
  @IsNumber()
  performance?: number;
} 