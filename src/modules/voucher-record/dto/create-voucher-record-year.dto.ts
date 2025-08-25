import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoucherRecordYearDto {
  @ApiProperty({ description: '客户ID', example: 1 })
  @IsNumber({}, { message: '客户ID必须是数字' })
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: number;

  @ApiProperty({ description: '年度', example: 2024 })
  @IsNumber({}, { message: '年度必须是数字' })
  @Min(2000, { message: '年度不能小于2000年' })
  @Max(2100, { message: '年度不能大于2100年' })
  @IsNotEmpty({ message: '年度不能为空' })
  year: number;

  @ApiProperty({ description: '存放位置', example: '办公室档案柜A-001', required: false })
  @IsString({ message: '存放位置必须是字符串' })
  @IsOptional()
  storageLocation?: string;

  @ApiProperty({ description: '经手人/负责人员', example: '张三', required: false })
  @IsString({ message: '经手人必须是字符串' })
  @IsOptional()
  handler?: string;

  @ApiProperty({ description: '取走记录/借出情况', required: false })
  @IsString({ message: '取走记录必须是字符串' })
  @IsOptional()
  withdrawalRecord?: string;

  @ApiProperty({ description: '通用备注', required: false })
  @IsString({ message: '通用备注必须是字符串' })
  @IsOptional()
  generalRemarks?: string;
} 