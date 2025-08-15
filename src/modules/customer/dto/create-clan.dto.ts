import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateClanDto {
  @ApiProperty({ description: '宗族名称', example: '张氏宗族' })
  @IsNotEmpty({ message: '宗族名称不能为空' })
  @IsString({ message: '宗族名称必须是字符串' })
  clanName: string;

  @ApiProperty({ 
    description: '成员列表', 
    type: [String], 
    example: ['张三', '张四', '张五'],
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '成员列表必须是数组' })
  @IsString({ each: true, message: '每个成员名称必须是字符串' })
  memberList?: string[];
}

export class AddMemberDto {
  @ApiProperty({ description: '宗族ID', example: 1 })
  @IsNotEmpty({ message: '宗族ID不能为空' })
  id: number;

  @ApiProperty({ description: '成员姓名', example: '六六3' })
  @IsNotEmpty({ message: '成员姓名不能为空' })
  @IsString({ message: '成员姓名必须是字符串' })
  memberName: string;
} 