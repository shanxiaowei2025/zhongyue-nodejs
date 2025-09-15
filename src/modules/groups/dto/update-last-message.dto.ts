import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

/**
 * 更新群组最后消息DTO
 * 格式与数据库字段保持一致
 */
export class UpdateLastMessageDto {
  @ApiProperty({
    description: '发送者用户ID',
    example: 'user_123456',
  })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({
    description: '消息ID',
    example: 'test123',
  })
  @IsString()
  @IsNotEmpty()
  msgId: string;

  @ApiProperty({
    description: '消息内容',
    example: '这是一条测试消息',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: '发送者类型',
    enum: ['employee', 'customer'],
    example: 'employee',
  })
  @IsString()
  @IsNotEmpty()
  fromType: 'employee' | 'customer';

  @ApiProperty({
    description: '消息创建时间（ISO 8601格式）',
    example: '2025-07-21T16:00:00Z',
  })
  @IsDateString()
  createTime: string;
} 