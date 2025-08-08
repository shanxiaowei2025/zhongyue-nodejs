import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
  @ApiProperty({ description: '考勤日期 YYYY-MM-DD', example: '2025-06-01' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ description: '员工姓名', example: '张三' })
  @IsString()
  name: string;

  @ApiProperty({ description: '员工工号', example: '10001' })
  @IsString()
  acctid: string;

  @ApiProperty({ description: '部门名称', example: '研发部' })
  @IsString()
  departs_name: string;

  @ApiProperty({
    description:
      '记录类型：1-固定上下班；2-外出；3-按班次上下班；4-自由签到；5-加班；7-无规则',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  record_type: number;

  @ApiProperty({ description: '日报类型：0-工作日；1-休息日', example: 0 })
  @IsNumber()
  @Type(() => Number)
  day_type: number;

  @ApiProperty({
    description: '上班时间 HH:MM',
    required: false,
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  checkintime_work?: string;

  @ApiProperty({
    description: '下班时间 HH:MM',
    required: false,
    example: '18:00',
  })
  @IsOptional()
  @IsString()
  checkintime_off_work?: string;

  @ApiProperty({ description: '当日打卡次数', required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  checkin_count?: number;

  @ApiProperty({
    description: '当日实际工作时长(小时)',
    required: false,
    example: 8.5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  regular_work_sec?: number;

  @ApiProperty({
    description: '当日标准工作时长(小时)',
    required: false,
    example: 8.0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  standard_work_sec?: number;

  // 异常信息
  @ApiProperty({ description: '迟到次数', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exception_late?: number;

  @ApiProperty({ description: '早退次数', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exception_early?: number;

  @ApiProperty({ description: '缺卡次数', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exception_absent?: number;

  @ApiProperty({ description: '旷工次数', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exception_missing?: number;

  @ApiProperty({ description: '地点异常次数', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exception_location?: number;

  @ApiProperty({ description: '设备异常次数', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exception_device?: number;

  // 加班信息
  @ApiProperty({
    description: '加班状态：0-无加班；1-正常；2-缺时长',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ot_status?: number;

  @ApiProperty({ description: '加班时长(小时)', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ot_duration?: number;
}
