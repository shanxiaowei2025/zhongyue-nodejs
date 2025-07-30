import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class ReviewerRejectRecordItemDto {
  @ApiProperty({ description: '复查退回日期', example: '2023-03-15' })
  @IsString()
  @Expose()
  date: string;

  @ApiProperty({ description: '复查退回原因', example: '整改措施不到位，需要重新整改' })
  @IsString()
  @Expose()
  reason: string;
}

export class ReviewerRejectDto {
  @ApiProperty({
    description: '复查审核退回记录',
    type: [ReviewerRejectRecordItemDto],
    example: [
      { date: '2023-03-15', reason: '整改措施不到位，需要重新整改' },
      { date: '2023-03-25', reason: '整改后仍有遗漏问题，请完善' }
    ]
  })
  @IsNotEmpty({ message: '复查审核退回记录不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewerRejectRecordItemDto)
  reviewerRejectRecords: ReviewerRejectRecordItemDto[];
} 