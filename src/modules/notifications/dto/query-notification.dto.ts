import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsNumberString, IsOptional } from 'class-validator';

export class QueryNotificationDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsNumberString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ description: '是否只获取新通知（未读）', example: false })
  @IsBooleanString()
  @IsOptional()
  onlyNew?: string;
} 