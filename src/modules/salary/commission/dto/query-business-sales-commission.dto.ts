import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryBusinessSalesCommissionDto {
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

  @ApiProperty({ description: '类型', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '底薪', required: false })
  @IsString()
  @IsOptional()
  baseSalary?: string;

  @ApiProperty({ description: '收费额', required: false })
  @IsString()
  @IsOptional()
  feeRange?: string;

  @ApiProperty({ description: '最低提成基数', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minCommissionBase?: number;

  @ApiProperty({ description: '提成比率', required: false })
  @IsString()
  @IsOptional()
  commissionRate?: string;
} 