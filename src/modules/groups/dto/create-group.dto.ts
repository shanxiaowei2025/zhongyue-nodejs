import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsObject, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 群组成员DTO
 */
export class GroupMemberDto {
  @ApiProperty({
    description: '用户ID',
    example: 'ZhongYueHuiJiCaoHaiLing131802350',
  })
  @IsString({ message: '用户ID必须是字符串' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId: string;

  @ApiProperty({
    description: '用户类型',
    example: 'employee',
    enum: ['employee', 'customer'],
  })
  @IsString({ message: '用户类型必须是字符串' })
  @IsIn(['employee', 'customer'], { message: '用户类型只能是 employee 或 customer' })
  userType: string;
}

/**
 * 创建群组DTO
 */
export class CreateGroupDto {
  @ApiProperty({
    description: '聊天ID',
    example: 'chat_123456789',
  })
  @IsString({ message: '聊天ID必须是字符串' })
  @IsNotEmpty({ message: '聊天ID不能为空' })
  chatId: string;

  @ApiProperty({
    description: '群组名称',
    example: '项目讨论群',
  })
  @IsString({ message: '群组名称必须是字符串' })
  @IsNotEmpty({ message: '群组名称不能为空' })
  name: string;

  @ApiProperty({
    description: '群组所有者',
    example: 'user_admin',
  })
  @IsString({ message: '群组所有者必须是字符串' })
  @IsNotEmpty({ message: '群组所有者不能为空' })
  owner: string;

  @ApiProperty({
    description: '成员列表',
    type: [GroupMemberDto],
    example: [
      { userId: 'ZhongYueHuiJiCaoHaiLing131802350', userType: 'employee' },
      { userId: 'aZhongYueHuiJiFuWuZhangYiRu13831', userType: 'employee' },
      { userId: 'wmFA_1BwAAXJlx117zYC0dObdL96UldA', userType: 'customer' }
    ],
  })
  @IsArray({ message: '成员列表必须是数组格式' })
  @ValidateNested({ each: true })
  @Type(() => GroupMemberDto)
  @IsNotEmpty({ message: '成员列表不能为空' })
  members: GroupMemberDto[];

  @ApiProperty({
    description: '最后一条消息',
    example: { content: '欢迎加入群组', sender: 'user_admin', timestamp: '2025-01-17T10:00:00Z' },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: '最后一条消息必须是对象格式' })
  lastMessage?: any;

  @ApiProperty({
    description: '最后一条员工消息',
    example: { content: '员工消息内容', sender: 'employee1', timestamp: '2025-01-17T10:00:00Z' },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: '最后一条员工消息必须是对象格式' })
  lastEmployeeMessage?: any;

  @ApiProperty({
    description: '最后一条客户消息',
    example: { content: '客户消息内容', sender: 'customer1', timestamp: '2025-01-17T10:00:00Z' },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: '最后一条客户消息必须是对象格式' })
  lastCustomerMessage?: any;

  @ApiProperty({
    description: '是否需要提醒',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: '是否需要提醒必须是布尔值' })
  needAlert?: boolean;

  @ApiProperty({
    description: '提醒级别',
    example: 1,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: '提醒级别必须是数字' })
  alertLevel?: number;
} 