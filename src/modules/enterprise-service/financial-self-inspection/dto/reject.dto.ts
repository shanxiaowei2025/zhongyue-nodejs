import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class RejectRecordItemDto {
  @ApiProperty({ description: '退回日期', example: '2023-02-15' })
  @IsString()
  @Expose()
  date: string;

  @ApiProperty({ description: '退回原因', example: '财务数据不完整，需要补充' })
  @IsString()
  @Expose()
  reason: string;
}

export class RejectDto {
  @ApiProperty({
    description: '审核退回记录',
    type: [RejectRecordItemDto],
    example: [
      { date: '2023-02-15', reason: '财务数据不完整，需要补充' },
      { date: '2023-03-01', reason: '部分凭证有误，请重新提交' }
    ]
  })
  @IsNotEmpty({ message: '审核退回记录不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RejectRecordItemDto)
  rejectRecords: RejectRecordItemDto[];
} 