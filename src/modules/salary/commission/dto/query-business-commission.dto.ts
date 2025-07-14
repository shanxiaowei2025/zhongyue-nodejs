import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryBusinessCommissionDto {
  @ApiProperty({ description: '收费额', required: false })
  @IsString()
  @IsOptional()
  feeRange?: string;

  @ApiProperty({ description: '提成比率', required: false })
  @IsString()
  @IsOptional()
  commissionRate?: string;
} 