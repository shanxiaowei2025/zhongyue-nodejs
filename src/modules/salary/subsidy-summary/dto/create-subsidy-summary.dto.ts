import { IsDate, IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubsidySummaryDto {
  @ApiProperty({ description: '姓名', example: '张三', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '部门', example: '财务部', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: '职位', example: '会计', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ description: '部门负责人补贴', required: false, example: 500.00 })
  @IsNumber()
  @IsOptional()
  departmentHeadSubsidy?: number;

  @ApiProperty({ description: '岗位津贴', required: false, example: 300.00 })
  @IsNumber()
  @IsOptional()
  positionAllowance?: number;

  @ApiProperty({ description: '油补', required: false, example: 200.00 })
  @IsNumber()
  @IsOptional()
  oilSubsidy?: number;

  @ApiProperty({ description: '餐补8元/天', required: false, example: 176.00 })
  @IsNumber()
  @IsOptional()
  mealSubsidy?: number;

  @ApiProperty({ description: '补贴合计', required: false, example: 1176.00 })
  @IsNumber()
  @IsOptional()
  totalSubsidy?: number;

  @ApiProperty({ description: '年月', example: '2023-06-01', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  yearMonth?: Date;
} 