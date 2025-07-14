import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAgencyCommissionDto {
  @ApiProperty({ description: '代理户数', required: false })
  @IsString()
  @IsOptional()
  agencyCount?: string;

  @ApiProperty({ description: '最低提成基数(元)', required: false })
  @IsString()
  @IsOptional()
  minCommissionBase?: string;

  @ApiProperty({ description: '收费额', required: false })
  @IsString()
  @IsOptional()
  feeRange?: string;

  @ApiProperty({ description: '提成比率', required: false })
  @IsString()
  @IsOptional()
  commissionRate?: string;
} 