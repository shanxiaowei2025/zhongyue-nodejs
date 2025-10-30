import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { BUSINESS_OPTION_CATEGORIES } from './create-business-option.dto';

/**
 * 查询业务选项DTO
 */
export class QueryBusinessOptionDto {
  @ApiProperty({ 
    description: '业务类别', 
    example: 'change_business',
    enum: BUSINESS_OPTION_CATEGORIES,
    required: false
  })
  @IsString({ message: '业务类别必须是字符串类型' })
  @IsOptional()
  @IsIn(BUSINESS_OPTION_CATEGORIES, { message: '无效的业务类别' })
  category?: string;

  @ApiProperty({ 
    description: '是否为默认选项', 
    example: true,
    required: false
  })
  @IsBoolean({ message: '是否为默认选项必须是布尔类型' })
  @IsOptional()
  @Type(() => Boolean)
  isDefault?: boolean;

  @ApiProperty({ 
    description: '页码', 
    example: 1,
    required: false,
    default: 1,
    minimum: 1
  })
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    description: '每页数量', 
    example: 10,
    required: false,
    default: 10,
    minimum: 1
  })
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}

