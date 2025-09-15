import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * 更新群组提醒设置DTO
 */
export class UpdateAlertSettingsDto {
  @ApiProperty({
    description: '是否开启提醒',
    example: true,
  })
  @IsBoolean({ message: '提醒开关必须是布尔值' })
  needAlert: boolean;

  @ApiProperty({
    description: '提醒级别（1-5，数字越大级别越高）',
    example: 3,
    required: false,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: '提醒级别必须是数字' })
  @Min(1, { message: '提醒级别最小为1' })
  @Max(5, { message: '提醒级别最大为5' })
  alertLevel?: number;
} 