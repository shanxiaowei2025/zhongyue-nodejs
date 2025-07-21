import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewerConfirmationDto {
  @ApiProperty({ description: '复查人确认完成', required: true, example: '2023-03-15' })
  @IsNotEmpty({ message: '复查人确认日期不能为空' })
  @IsDateString()
  reviewerConfirmation: string;

  @ApiProperty({ description: '复查备注', required: false, example: '已与客户再次确认' })
  @IsOptional()
  @IsString()
  reviewerRemarks?: string;
} 