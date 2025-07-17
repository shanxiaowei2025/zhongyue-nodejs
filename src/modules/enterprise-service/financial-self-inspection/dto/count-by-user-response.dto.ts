import { ApiProperty } from '@nestjs/swagger';

export class UserCountItem {
  @ApiProperty({ description: '用户名', example: '张三' })
  name: string;

  @ApiProperty({ description: '记录数量', example: 5 })
  count: number;
}

export class CountByUserResponseDto {
  @ApiProperty({ 
    description: '用户统计列表', 
    type: [UserCountItem],
    example: [
      { name: '张三', count: 5 },
      { name: '李四', count: 3 },
      { name: '王五', count: 2 }
    ]
  })
  items: UserCountItem[];

  @ApiProperty({ description: '总记录数', example: 10 })
  total: number;
} 