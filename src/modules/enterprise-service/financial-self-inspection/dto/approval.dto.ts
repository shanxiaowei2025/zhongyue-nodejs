import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class ApprovalRecordItemDto {
  @ApiProperty({ description: '审核通过日期', example: '2023-02-15' })
  @IsString()
  @Expose()
  date: string;

  @ApiProperty({ description: '审核备注', example: '已与客户沟通确认' })
  @IsString()
  @Expose()
  remark: string;
}

export class ApprovalDto {
  @ApiProperty({
    description: '审核通过记录',
    type: [ApprovalRecordItemDto],
    example: [
      { date: '2023-02-15', remark: '已与客户沟通确认' },
      { date: '2023-03-01', remark: '再次确认无误' },
    ],
  })
  @IsNotEmpty({ message: '审核通过记录不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalRecordItemDto)
  approvalRecords: ApprovalRecordItemDto[];
}
