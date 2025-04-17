import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsOptional, IsString, MinLength, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: '张三' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  password: string;

  @ApiProperty({ description: '部门ID', example: 1 })
  @IsNotEmpty({ message: '部门ID不能为空' })
  @IsNumber({}, { message: '部门ID必须是数字' })
  dept_id: number;

  @ApiProperty({ description: '是否启用', example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;

  @ApiProperty({ description: '手机号码', example: '13800138000', required: false })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  phone?: string;
  
  @ApiProperty({ description: '邮箱', example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '角色列表', example: ['user'], required: false })
  @IsOptional()
  @IsArray({ message: '角色必须是数组' })
  roles?: string[];
} 