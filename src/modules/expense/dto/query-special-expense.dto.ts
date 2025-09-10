import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuerySpecialExpenseDto extends PaginationDto {
  @ApiProperty({ description: '业务员', required: false })
  @IsOptional()
  @IsString()
  salesperson?: string;

  @ApiProperty({ description: '开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;
} 