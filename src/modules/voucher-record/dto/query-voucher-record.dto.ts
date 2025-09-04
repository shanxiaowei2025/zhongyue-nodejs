import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryVoucherRecordDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码不能小于1' })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能大于100' })
  limit?: number = 10;

  @ApiProperty({ description: '客户ID', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '客户ID必须是数字' })
  customerId?: number;

  @ApiProperty({ description: '年度', example: 2024, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '年度必须是数字' })
  year?: number;

  @ApiProperty({ description: '存放位置关键词', example: '档案柜', required: false })
  @IsOptional()
  @IsString({ message: '存放位置必须是字符串' })
  storageLocation?: string;

  @ApiProperty({ description: '经手人关键词', example: '张三', required: false })
  @IsOptional()
  @IsString({ message: '经手人必须是字符串' })
  handler?: string;

  @ApiProperty({ 
    description: '月度状态筛选（由前端定义具体内容）', 
    example: '已完成',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  status?: string;

  @ApiProperty({ 
    description: '顾问会计关键词', 
    example: '李四',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '顾问会计必须是字符串' })
  consultantAccountant?: string;

  @ApiProperty({ 
    description: '记账会计关键词', 
    example: '王五',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '记账会计必须是字符串' })
  bookkeepingAccountant?: string;
} 