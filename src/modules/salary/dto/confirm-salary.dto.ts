import { IsBoolean } from 'class-validator';
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
} 