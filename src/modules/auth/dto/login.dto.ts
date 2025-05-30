// 登录时的数据结构
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '../../../common/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: '管理员' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
