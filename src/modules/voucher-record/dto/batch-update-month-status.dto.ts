import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MonthStatusUpdateDto {
  @ApiProperty({ 
    description: '月份（1-12）', 
    example: 1, 
    minimum: 1, 
    maximum: 12 
  })
  @IsNumber({}, { message: '月份必须是数字' })
  @Min(1, { message: '月份不能小于1' })
  @Max(12, { message: '月份不能大于12' })
  @IsNotEmpty({ message: '月份不能为空' })
  month: number;

  @ApiProperty({ 
    description: '状态（由前端定义具体内容）', 
    example: '已完成'
  })
  @IsString({ message: '状态必须是字符串' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: string;

  @ApiProperty({ 
    description: '月度说明/备注', 
    example: '1月份凭证已处理完成',
    required: false 
  })
  @IsString({ message: '月度说明必须是字符串' })
  @IsOptional()
  description?: string;
}

@ApiExtraModels(MonthStatusUpdateDto)
export class BatchUpdateMonthStatusDto {
  @ApiProperty({
    description: '月度状态更新列表',
    type: [MonthStatusUpdateDto],
    example: [
      {
        month: 1,
        status: '已完成',
        description: '1月份凭证已处理完成'
      },
      {
        month: 2,
        status: '进行中',
        description: '2月份凭证处理中'
      },
      {
        month: 3,
        status: '待处理'
      }
    ]
  })
  @IsArray({ message: '更新列表必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => MonthStatusUpdateDto)
  @IsNotEmpty({ message: '更新列表不能为空' })
  updates: MonthStatusUpdateDto[];
} 