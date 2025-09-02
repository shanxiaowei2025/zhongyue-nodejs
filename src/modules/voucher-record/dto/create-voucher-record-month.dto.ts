import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoucherRecordMonthDto {
  @ApiProperty({ description: '年度记录ID', example: 1 })
  @IsNumber({}, { message: '年度记录ID必须是数字' })
  @IsNotEmpty({ message: '年度记录ID不能为空' })
  yearRecordId: number;

  @ApiProperty({ description: '月份（1-12）', example: 1, minimum: 1, maximum: 12 })
  @IsNumber({}, { message: '月份必须是数字' })
  @Min(1, { message: '月份不能小于1' })
  @Max(12, { message: '月份不能大于12' })
  @IsNotEmpty({ message: '月份不能为空' })
  month: number;

  @ApiProperty({ 
    description: '状态（由前端定义具体内容）', 
    example: '已完成',
    required: false
  })
  @IsString({ message: '状态必须是字符串' })
  @IsOptional()
  status?: string;

  @ApiProperty({ description: '月度说明/备注', required: false })
  @IsString({ message: '月度说明必须是字符串' })
  @IsOptional()
  description?: string;
} 