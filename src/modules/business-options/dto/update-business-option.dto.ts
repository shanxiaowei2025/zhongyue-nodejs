import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

/**
 * 更新业务选项DTO
 */
export class UpdateBusinessOptionDto {
  @ApiProperty({ 
    description: '选项值', 
    example: '地址变更（新）',
    required: false
  })
  @IsString({ message: '选项值必须是字符串类型' })
  @IsOptional()
  @MaxLength(200, { message: '选项值长度不能超过200个字符' })
  optionValue?: string;

  @ApiProperty({ 
    description: '是否为默认选项', 
    example: false,
    required: false
  })
  @IsBoolean({ message: '是否为默认选项必须是布尔类型' })
  @IsOptional()
  isDefault?: boolean;
}

