import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateReviewerFieldsDto {
  @ApiProperty({ description: '复查问题', required: true, example: '仍有部分发票未入账' })
  @IsNotEmpty({ message: '复查问题不能为空' })
  @IsString()
  reviewerProblem: string;

  @ApiProperty({ description: '复查解决方案', required: true, example: '再次补充入账' })
  @IsNotEmpty({ message: '复查解决方案不能为空' })
  @IsString()
  reviewerSolution: string;
} 