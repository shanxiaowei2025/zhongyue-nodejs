import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryBusinessSalesCommissionDto {
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

  @ApiProperty({ description: '提成比率', required: false })
  @IsString()
  @IsOptional()
  commissionRate?: string;
} 