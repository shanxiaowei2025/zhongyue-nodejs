import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceDetailDto {
  @ApiProperty({ description: '考勤记录ID', example: 1 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  id: number;
} 