import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
  @ApiProperty({ description: '用户名（支持模糊查询）', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '当前页码',
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: '每页记录数',
    minimum: 1,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
