import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryBusinessStatisticsDto {
  @ApiPropertyOptional({
    description: '开始日期 (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期 (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '业务员姓名',
    example: '张三',
  })
  @IsOptional()
  // 支持单个业务员或多个业务员（数组或重复的 query 参数）
  // 例如: ?salesperson=张三 或 ?salesperson=张三&salesperson=李四
  salesperson?: string | string[];

  @ApiPropertyOptional({
    description: '业务状态筛选',
    enum: ['新增', '续费'],
    example: '续费',
  })
  @IsOptional()
  @IsIn(['新增', '续费'])
  businessStatus?: string;
}
