import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class RectificationCompletionDto {
  @ApiProperty({
    description: '整改完成日期',
    required: true,
    example: '2023-02-01',
  })
  @IsNotEmpty({ message: '整改完成日期不能为空' })
  @IsDateString()
  rectificationCompletionDate: string;

  @ApiProperty({
    description: '整改结果',
    required: false,
    example: '已完成所有账务调整',
  })
  @IsOptional()
  @IsString()
  rectificationResult?: string;
}
