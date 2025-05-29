// 查询客户时的参数结构
import { IsOptional, IsString, IsDate, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessStatus } from '../enums/customer.enum';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: '企业名称关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '税号' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

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

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

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