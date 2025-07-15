// 查询客户时的参数结构
import { IsOptional, IsString, IsDate, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessStatus } from '../enums/customer.enum';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: '企业名称关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '统一社会信用代码' })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiPropertyOptional({ description: '顾问会计' })
  @IsOptional()
  @IsString()
  consultantAccountant?: string;

  @ApiPropertyOptional({ description: '记账会计' })
  @IsOptional()
  @IsString()
  bookkeepingAccountant?: string;

  @ApiPropertyOptional({ description: '企业所属的税务分局' })
  @IsOptional()
  @IsString()
  taxBureau?: string;

  @ApiPropertyOptional({ description: '企业类型' })
  @IsOptional()
  @IsString()
  enterpriseType?: string;

  @ApiPropertyOptional({ description: '行业大类' })
  @IsOptional()
  @IsString()
  industryCategory?: string;

  @ApiPropertyOptional({ description: '企业当前的经营状态' })
  @IsOptional()
  @IsString()
  enterpriseStatus?: string;

  @ApiPropertyOptional({ description: '客户分级' })
  @IsOptional()
  @IsString()
  customerLevel?: string;

  @ApiPropertyOptional({ description: '当前业务的状态' })
  @IsOptional()
  @IsEnum(BusinessStatus)
  businessStatus?: BusinessStatus;

  @ApiPropertyOptional({ description: '出资人姓名关键词' })
  @IsOptional()
  @IsString()
  contributorName?: string;

  @ApiPropertyOptional({ description: '行政许可类型关键词' })
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiPropertyOptional({ 
    description: '创建开始日期（筛选创建时间开始日期，格式：YYYY-MM-DD）',
    example: '2023-01-01'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: '创建结束日期（筛选创建时间结束日期，当与startDate相同时，会查询整天的数据，格式：YYYY-MM-DD）',
    example: '2023-12-31'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '备注信息关键词' })
  @IsOptional()
  @IsString()
  remarks?: string;
  
  @ApiPropertyOptional({ description: '归属地' })
  @IsOptional()
  @IsString()
  location?: string;
}