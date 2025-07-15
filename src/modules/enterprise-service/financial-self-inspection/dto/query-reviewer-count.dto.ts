import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class QueryReviewerCountDto {
  @ApiProperty({ 
    description: '复查人确认开始日期', 
    required: false,
    example: '2023-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    description: '复查人确认结束日期（当与开始日期相同时，会统计整天的数据）', 
    required: false,
    example: '2023-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
} 