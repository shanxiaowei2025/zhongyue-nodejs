import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 重命名为UpdatePasswordDto，保持与导入引用一致
 * 这只是ChangePasswordDto的别名，用于修复编译错误
 */
export class UpdatePasswordDto {
  @ApiProperty({
    description: '原密码',
    example: 'oldPassword123',
  })
  @IsNotEmpty({ message: '原密码不能为空' })
  @IsString({ message: '原密码必须是字符串' })
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123',
  })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码长度不能小于6位' })
  newPassword: string;
}

// 重导出ChangePasswordDto为UpdatePasswordDto
import { ChangePasswordDto } from './change-password.dto';
export { ChangePasswordDto as AlternativeUpdatePasswordDto };
