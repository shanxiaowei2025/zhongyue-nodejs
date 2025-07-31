import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmSalaryDto {
  @ApiProperty({
    description: '确认状态',
    type: 'boolean',
    required: true,
    default: true,
    example: true
  })
  @IsBoolean()
  isConfirmed: boolean;

  @ApiProperty({
    description: '备注',
    required: false,
    example: '已确认本月薪资'
  })
  @IsOptional()
  remark?: string;
} 