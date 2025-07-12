import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class InspectorConfirmationDto {
  @ApiProperty({
    description: '抽查人确认完成',
    required: true,
    example: '2023-02-15',
  })
  @IsNotEmpty({ message: '抽查人确认日期不能为空' })
  @IsDateString()
  inspectorConfirmation: string;

  @ApiProperty({
    description: '备注',
    required: false,
    example: '已与客户沟通',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
