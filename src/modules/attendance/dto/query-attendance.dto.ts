import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 考勤异常类型
 * - 0: 所有异常（查询所有类型异常记录）
 * - 1: 迟到（早上或下午上班迟到）
 * - 2: 早退（上午或下午提前下班）
 * - 3: 缺卡（未打上班或下班卡）
 * - 4: 旷工（整天未打卡）
 * - 5: 地点异常（打卡地点不在规定范围）
 * - 6: 设备异常（使用非授权设备打卡）
 */
export enum AttendanceExceptionType {
  ALL = 0, // 所有异常
  LATE = 1, // 迟到
  EARLY = 2, // 早退
  ABSENT = 3, // 缺卡
  MISSING = 4, // 旷工
  LOCATION = 5, // 地点异常
  DEVICE = 6, // 设备异常
}

export class QueryAttendanceDto extends PaginationDto {
  @ApiProperty({ description: '员工姓名', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '员工工号', required: false })
  @IsOptional()
  @IsString()
  acctid?: string;

  @ApiProperty({ description: '部门名称', required: false })
  @IsOptional()
  @IsString()
  departs_name?: string;

  @ApiProperty({ description: '开始日期 YYYY-MM-DD', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期 YYYY-MM-DD', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '是否有异常(0-无异常, 1-有异常)',
    required: false,
    enum: [0, 1],
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hasException?: number;

  @ApiProperty({
    description:
      '异常类型：0-所有异常，1-迟到，2-早退，3-缺卡，4-旷工，5-地点异常，6-设备异常',
    required: false,
    enum: AttendanceExceptionType,
    example: 0,
  })
  @IsOptional()
  @IsEnum(AttendanceExceptionType)
  @Type(() => Number)
  exceptionType?: AttendanceExceptionType;

  @ApiProperty({
    description: '日报类型：0-工作日，1-休息日',
    required: false,
    enum: [0, 1],
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  day_type?: number;

  @ApiProperty({
    description: '加班状态：0-无加班，1-正常加班，2-加班缺时长',
    required: false,
    enum: [0, 1, 2],
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ot_status?: number;

  @ApiProperty({ description: '排序字段', required: false, default: 'date' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty({
    description: '排序方向：ASC-升序，DESC-降序',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
