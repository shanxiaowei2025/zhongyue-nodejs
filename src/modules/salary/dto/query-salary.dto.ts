import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySalaryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '身份证号' })
  @IsOptional()
  @IsString()
  idCard?: string;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  type?: string;

  // 注意：company字段已从数据库中删除，如需公司查询功能，可考虑使用员工表中的payrollCompany字段
  // @ApiPropertyOptional({ description: '公司' })
  // @IsOptional()
  // @IsString()
  // company?: string;

  @ApiPropertyOptional({ 
    description: '是否已发放', 
    type: 'boolean',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: '年月' })
  @IsOptional()
  @IsDate()
  yearMonth?: Date;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
