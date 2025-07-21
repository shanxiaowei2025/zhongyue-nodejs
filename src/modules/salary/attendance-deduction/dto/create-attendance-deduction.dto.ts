import { IsDate, IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendanceDeductionDto {
  @ApiProperty({ description: '姓名', example: '张三', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '考勤扣款', required: false, example: 100.00 })
  @IsNumber()
  @IsOptional()
  attendanceDeduction?: number;

  @ApiProperty({ description: '全勤奖励', required: false, example: 200.00 })
  @IsNumber()
  @IsOptional()
  fullAttendanceBonus?: number;

  @ApiProperty({ description: '年月', example: '2023-06-01', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  yearMonth?: Date;

  @ApiProperty({ description: '备注', example: '迟到3次', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
} 