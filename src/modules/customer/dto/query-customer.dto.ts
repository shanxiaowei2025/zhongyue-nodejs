// 查询客户时的参数结构
import { IsOptional, IsString, IsDate, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnterpriseStatus, TaxRegistrationType, BusinessStatus } from '../enums/customer.enum';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: '企业名称关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '统一社会信用代码' })
  @IsOptional()
  @IsString()
  socialCreditCode?: string;

  @ApiPropertyOptional({ description: '业务员姓名' })
  @IsOptional()
  @IsString()
  salesRepresentative?: string;

  @ApiPropertyOptional({ description: '企业所属的税务分局' })
  @IsOptional()
  @IsString()
  taxBureau?: string;

  @ApiPropertyOptional({ description: '企业的税务登记类型' })
  @IsOptional()
  @IsEnum(TaxRegistrationType)
  taxRegistrationType?: TaxRegistrationType;

  @ApiPropertyOptional({ description: '企业当前的经营状态' })
  @IsOptional()
  @IsEnum(EnterpriseStatus)
  enterpriseStatus?: EnterpriseStatus;

  @ApiPropertyOptional({ description: '当前业务的状态' })
  @IsOptional()
  @IsEnum(BusinessStatus)
  businessStatus?: BusinessStatus;

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
} 