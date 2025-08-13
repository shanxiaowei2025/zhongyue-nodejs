import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ 
    description: '通知标题',
    example: '通知测试'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: '通知内容',
    example: '给用户id为1,2,3的用户，角色为admin的用户，部门id为1,2的用户发送通知'
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ 
    description: '通知类型（自由字符串，由前端自定义）', 
    example: 'system',
    default: 'system'
  })
  @IsString()
  @IsOptional()
  type?: string = 'system';

  @ApiPropertyOptional({ 
    description: '直接指定的用户ID列表', 
    type: [Number],
    example: [1, 2, 3],
    default: []
  })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  targetUsers?: number[] = [];

  @ApiPropertyOptional({ 
    description: '按角色推送，角色名数组', 
    type: [String],
    example: ['admin'],
    default: []
  })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  targetRoles?: string[] = [];

  @ApiPropertyOptional({ 
    description: '按部门推送，部门ID数组', 
    type: [Number],
    example: [1, 2],
    default: []
  })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  targetDepts?: number[] = [];
} 