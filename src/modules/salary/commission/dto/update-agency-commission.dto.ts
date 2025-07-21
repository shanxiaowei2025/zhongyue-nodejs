import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAgencyCommissionDto {
  @ApiProperty({ description: '代理户数', required: false })
  @IsString()
  @IsOptional()
  agencyCount?: string;

  @ApiProperty({ description: '最低提成基数(元)', required: false })
  @IsNumber({}, { message: '最低提成基数必须是数字' })
  @Type(() => Number)
  @IsOptional()
  minCommissionBase?: number;

  @ApiProperty({ description: '收费额', required: false })
  @IsString()
  @IsOptional()
  feeRange?: string;

  @ApiProperty({ description: '提成比率', required: false })
  @IsNumber({}, { message: '提成比率必须是数字' })
  @Type(() => Number)
  @IsOptional()
  commissionRate?: number;
} 