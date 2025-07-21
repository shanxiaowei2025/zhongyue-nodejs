import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class QuerySocialInsuranceDto extends PaginationDto {
  @ApiProperty({ description: '姓名（支持模糊查询）', required: false, example: '张' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '年月', required: false, example: '2025-06' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  yearMonth?: Date;

  @ApiProperty({ description: '开始日期', required: false, example: '2025-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false, example: '2025-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
} 