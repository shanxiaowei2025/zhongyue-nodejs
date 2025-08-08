import {
  IsDate,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFriendCirclePaymentDto {
  @ApiProperty({ description: '姓名', example: '张三', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '第一周', required: false, example: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weekOne?: number;

  @ApiProperty({ description: '第二周', required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weekTwo?: number;

  @ApiProperty({ description: '第三周', required: false, example: 4 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weekThree?: number;

  @ApiProperty({ description: '第四周', required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weekFour?: number;

  @ApiProperty({ description: '总数', required: false, example: 14 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalCount?: number;

  @ApiProperty({ description: '扣款', required: false, example: 100.0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  payment?: number;

  @ApiProperty({ description: '是否完成', required: false, example: false })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty({ description: '年月', example: '2023-06-01', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  yearMonth?: Date;
}
