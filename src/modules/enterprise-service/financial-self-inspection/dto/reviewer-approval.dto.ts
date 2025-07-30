import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class ReviewerApprovalRecordItemDto {
  @ApiProperty({ description: '复查审核通过日期', example: '2023-03-15' })
  @IsString()
  @Expose()
  date: string;

  @ApiProperty({ description: '复查备注', example: '已与复查人员确认无误' })
  @IsString()
  @Expose()
  remark: string;
}

export class ReviewerApprovalDto {
  @ApiProperty({ 
    description: '复查审核通过记录', 
    type: [ReviewerApprovalRecordItemDto], 
    example: [
      { date: '2023-03-15', remark: '已与复查人员确认无误' },
      { date: '2023-03-25', remark: '复查完成，问题已解决' }
    ] 
  })
  @IsNotEmpty({ message: '复查审核通过记录不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewerApprovalRecordItemDto)
  reviewerApprovalRecords: ReviewerApprovalRecordItemDto[];
} 