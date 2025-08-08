import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAttendanceDeductionDto extends PaginationDto {
  @ApiProperty({ description: '姓名（支持模糊查询）', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '年月', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  yearMonth?: Date;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
