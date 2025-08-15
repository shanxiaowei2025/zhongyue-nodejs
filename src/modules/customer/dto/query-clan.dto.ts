import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryClanDto {
  @ApiProperty({ description: '宗族名称', required: false })
  @IsOptional()
  @IsString()
  clanName?: string;

  @ApiProperty({ description: '成员姓名', required: false })
  @IsOptional()
  @IsString()
  memberName?: string;

  @ApiProperty({ description: '创建人', required: false })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;
} 