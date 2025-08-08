import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: '密码',
    example: 'NewPassword123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  password?: string;
}
