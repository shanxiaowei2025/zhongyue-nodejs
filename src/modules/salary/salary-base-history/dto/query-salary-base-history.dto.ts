import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuerySalaryBaseHistoryDto {
  @ApiProperty({ description: '员工姓名', required: false })
  @IsString()
  @IsOptional()
  employeeName?: string;

  @ApiProperty({ description: '修改人', required: false })
  @IsString()
  @IsOptional()
  modifiedBy?: string;

  @ApiProperty({ description: '开始时间', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
} 