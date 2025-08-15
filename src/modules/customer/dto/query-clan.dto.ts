import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryClanDto {
  @ApiProperty({ description: '宗族名称（支持模糊查询和精确匹配）', required: false })
  @IsOptional()
  @IsString()
  clanName?: string;

  @ApiProperty({ 
    description: '是否精确匹配宗族名称', 
    required: false, 
    default: false,
    type: Boolean 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  })
  @IsBoolean()
  exactMatch?: boolean = false;

  @ApiProperty({ description: '成员姓名', required: false })
  @IsOptional()
  @IsString()
  memberName?: string;

  @ApiProperty({ 
    description: '是否只返回宗族名称列表', 
    required: false, 
    default: false,
    type: Boolean 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  })
  @IsBoolean()
  namesOnly?: boolean = false;

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