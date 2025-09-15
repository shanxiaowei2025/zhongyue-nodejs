import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 查询群组DTO
 */
export class QueryGroupDto extends PaginationDto {
  @ApiProperty({
    description: '群组名称（支持模糊查询）',
    example: '项目讨论群',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '群组名称必须是字符串' })
  name?: string;

  @ApiProperty({
    description: '群组所有者',
    example: 'user_admin',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '群组所有者必须是字符串' })
  owner?: string;

  @ApiProperty({
    description: '是否需要提醒',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean({ message: '是否需要提醒必须是布尔值' })
  needAlert?: boolean;

  @ApiProperty({
    description: '提醒级别',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: '提醒级别必须是数字' })
  alertLevel?: number;

  @ApiProperty({
    description: '排序字段',
    example: 'createdAt',
    required: false,
    enum: ['id', 'chatId', 'name', 'owner', 'needAlert', 'alertLevel', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortField?: string;

  @ApiProperty({
    description: '排序方式',
    example: 'DESC',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString({ message: '排序方式必须是字符串' })
  sortOrder?: 'ASC' | 'DESC';
} 