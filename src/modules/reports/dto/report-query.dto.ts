import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 代理费收费变化分析查询DTO
 */
export class AgencyFeeAnalysisDto extends PaginationDto {
  @ApiProperty({ 
    description: '对比年份，默认当前年份', 
    default: new Date().getFullYear(), 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number = new Date().getFullYear();

  @ApiProperty({ 
    description: '减少金额阈值，默认500', 
    default: 500, 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  threshold?: number = 500;
}

/**
 * 新增客户统计查询DTO
 */
export class NewCustomerStatsDto extends PaginationDto {
  @ApiProperty({ description: '年份，如：2024', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiProperty({ description: '月份，1-12', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number;

  @ApiProperty({ 
    description: '开始日期 YYYY-MM-DD（基于客户创建时间customer.createTime字段筛选）', 
    required: false,
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    description: '结束日期 YYYY-MM-DD（基于客户创建时间customer.createTime字段筛选）', 
    required: false,
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * 员工业绩统计查询DTO
 */
export class EmployeePerformanceDto extends PaginationDto {
  @ApiProperty({ description: '月份 YYYY-MM', required: false })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({ description: '员工姓名', required: false })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiProperty({ description: '部门', required: false })
  @IsOptional()
  @IsString()
  department?: string;
}

/**
 * 客户等级分布统计查询DTO
 */
export class CustomerLevelDistributionDto extends PaginationDto {
  @ApiProperty({ 
    description: '年份，如：2024', 
    required: false,
    example: 2024
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(3000)
  year?: number;

  @ApiProperty({ 
    description: '月份，如：1-12', 
    required: false,
    minimum: 1,
    maximum: 12,
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

/**
 * 客户流失统计查询DTO
 */
export class CustomerChurnStatsDto extends PaginationDto {
  @ApiProperty({ 
    description: '年份，如：2024', 
    required: false,
    example: 2024
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiProperty({ 
    description: '月份，1-12', 
    required: false,
    minimum: 1,
    maximum: 12,
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

/**
 * 代理服务到期客户统计查询DTO
 */
export class ServiceExpiryStatsDto extends PaginationDto {
  // 新的逻辑不需要额外参数，基于年月比较判断到期
}

/**
 * 会计负责客户数量统计查询DTO
 */
export class AccountantClientStatsDto extends PaginationDto {
  @ApiProperty({ description: '会计类型：consultantAccountant-顾问会计，bookkeepingAccountant-记账会计，invoiceOfficer-开票员', enum: ['consultantAccountant', 'bookkeepingAccountant', 'invoiceOfficer', 'all'], default: 'all', required: false })
  @IsOptional()
  @IsEnum(['consultantAccountant', 'bookkeepingAccountant', 'invoiceOfficer', 'all'])
  accountantType?: 'consultantAccountant' | 'bookkeepingAccountant' | 'invoiceOfficer' | 'all' = 'all';

  @ApiProperty({ description: '会计姓名', required: false })
  @IsOptional()
  @IsString()
  accountantName?: string;
} 