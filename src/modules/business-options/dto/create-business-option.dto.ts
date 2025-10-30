import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength, IsIn } from 'class-validator';

/**
 * 业务选项类别枚举
 */
export const BUSINESS_OPTION_CATEGORIES = [
  'change_business',              // 变更业务
  'administrative_license',       // 行政许可
  'other_business_basic',         // 其他业务（基础）
  'other_business_outsourcing',   // 其他业务
  'other_business_special',       // 其他业务（特殊）
] as const;

export type BusinessOptionCategory = typeof BUSINESS_OPTION_CATEGORIES[number];

/**
 * 创建业务选项DTO
 */
export class CreateBusinessOptionDto {
  @ApiProperty({ 
    description: '业务类别', 
    example: 'change_business',
    enum: BUSINESS_OPTION_CATEGORIES,
    required: true
  })
  @IsString({ message: '业务类别必须是字符串类型' })
  @IsNotEmpty({ message: '业务类别不能为空' })
  @IsIn(BUSINESS_OPTION_CATEGORIES, { message: '无效的业务类别' })
  @MaxLength(100, { message: '业务类别长度不能超过100个字符' })
  category: string;

  @ApiProperty({ 
    description: '选项值', 
    example: '地址变更',
    required: true
  })
  @IsString({ message: '选项值必须是字符串类型' })
  @IsNotEmpty({ message: '选项值不能为空' })
  @MaxLength(200, { message: '选项值长度不能超过200个字符' })
  optionValue: string;

  @ApiProperty({ 
    description: '是否为默认选项', 
    example: false,
    required: false,
    default: false
  })
  @IsBoolean({ message: '是否为默认选项必须是布尔类型' })
  @IsOptional()
  isDefault?: boolean;
}

