import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewerRectificationCompletionDto {
  @ApiProperty({ description: '复查整改完成日期', required: true, example: '2023-03-01' })
  @IsNotEmpty({ message: '复查整改完成日期不能为空' })
  @IsDateString()
  reviewerRectificationCompletionDate: string;

  @ApiProperty({ description: '复查整改结果', required: false, example: '已完成全部补充入账' })
  @IsOptional()
  @IsString()
  reviewerRectificationResult?: string;
} 