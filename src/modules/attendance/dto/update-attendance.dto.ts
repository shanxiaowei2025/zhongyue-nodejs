import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';
import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {
  @ApiProperty({ description: '考勤记录ID', example: 1 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  id: number;
}
