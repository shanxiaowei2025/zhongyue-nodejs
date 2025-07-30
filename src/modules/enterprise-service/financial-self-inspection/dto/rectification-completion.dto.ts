import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class RectificationRecordItemDto {
  @ApiProperty({ description: '整改完成日期', example: '2023-02-01' })
  @IsString()
  @Expose()
  date: string;

  @ApiProperty({ description: '整改结果', example: '已完成所有账务调整' })
  @IsString()
  @Expose()
  result: string;
}

export class RectificationCompletionDto {
  @ApiProperty({ 
    description: '整改记录', 
    type: [RectificationRecordItemDto], 
    example: [
      { date: '2023-02-01', result: '已完成账务调整' },
      { date: '2023-02-15', result: '已完成其他整改事项' }
    ] 
  })
  @IsNotEmpty({ message: '整改记录不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RectificationRecordItemDto)
  rectificationRecords: RectificationRecordItemDto[];
} 