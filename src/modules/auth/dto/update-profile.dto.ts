import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: '手机号码', example: '13800138000', required: false })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  phone?: string;

  @ApiProperty({ description: '身份证号', example: '110101199001011234', required: false })
  @IsOptional()
  @IsString({ message: '身份证号必须是字符串' })
  idCardNumber?: string;
}
