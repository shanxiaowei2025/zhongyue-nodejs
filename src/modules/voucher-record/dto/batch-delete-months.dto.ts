import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BatchDeleteMonthsDto {
  @ApiProperty({ 
    description: '月度记录ID数组', 
    example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    type: [Number]
  })
  @Type(() => Number)
  @IsArray({ message: 'ids必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一个ID' })
  @IsNumber({}, { each: true, message: '每个ID都必须是数字' })
  ids: number[];
} 