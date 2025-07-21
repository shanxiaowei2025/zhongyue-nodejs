import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAgencyCommissionDto {
  @ApiProperty({ description: '代理户数' })
  @IsNotEmpty({ message: '代理户数不能为空' })
  @IsString()
  agencyCount: string;

  @ApiProperty({ description: '最低提成基数(元)' })
  @IsNotEmpty({ message: '最低提成基数不能为空' })
  @IsNumber({}, { message: '最低提成基数必须是数字' })
  @Type(() => Number)
  minCommissionBase: number;

  @ApiProperty({ description: '收费额' })
  @IsNotEmpty({ message: '收费额不能为空' })
  @IsString()
  feeRange: string;

  @ApiProperty({ description: '提成比率' })
  @IsNotEmpty({ message: '提成比率不能为空' })
  @IsNumber({}, { message: '提成比率必须是数字' })
  @Type(() => Number)
  commissionRate: number;
} 