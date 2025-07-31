import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepositDto {
  @ApiProperty({ 
    description: '姓名',
    example: '张三'
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ 
    description: '保证金扣除金额',
    example: 1000
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ 
    description: '扣除日期',
    example: '2023-07-01'
  })
  @IsString() // 只验证为字符串，不进行日期格式验证
  deductionDate: string; // 改为字符串类型

  @ApiProperty({ 
    description: '备注',
    required: false,
    example: '入职保证金'
  })
  @IsString()
  @IsOptional()
  remark?: string;
} 