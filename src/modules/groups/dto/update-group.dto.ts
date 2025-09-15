import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';
import { IsOptional, IsString } from 'class-validator';

/**
 * 更新群组DTO
 */
export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiProperty({
    description: '聊天ID（更新时可选）',
    example: 'chat_123456789',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '聊天ID必须是字符串' })
  chatId?: string;

  @ApiProperty({
    description: '群组名称（更新时可选）',
    example: '项目讨论群',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '群组名称必须是字符串' })
  name?: string;

  @ApiProperty({
    description: '群组所有者（更新时可选）',
    example: 'user_admin',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '群组所有者必须是字符串' })
  owner?: string;
} 