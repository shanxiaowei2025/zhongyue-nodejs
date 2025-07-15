import { ApiProperty } from '@nestjs/swagger';

export class CountResponseDto {
  @ApiProperty({ 
    description: '符合条件的记录数量', 
    example: 42
  })
  count: number;
} 