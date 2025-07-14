import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateBusinessCommissionDto {
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