import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBusinessSalesCommissionDto {
  @ApiProperty({ description: '类型' })
  @IsNotEmpty({ message: '类型不能为空' })
  @IsString()
  type: string;

  @ApiProperty({ description: '底薪' })
  @IsNotEmpty({ message: '底薪不能为空' })
  @IsNumber({}, { message: '底薪必须是数字' })
  @Type(() => Number)
  baseSalary: number;

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
