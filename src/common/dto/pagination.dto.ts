import { IsNumber, IsOptional, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  pageSize?: number;

  @ApiProperty({ 
    description: '排序字段', 
    required: false,
    example: 'createTime'
  })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty({
    description: '排序类型：ASC-升序，DESC-降序',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
