import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryExpenseDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiProperty({
    description: '状态：0-未审核，1-已审核，2-已退回',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '业务员', required: false })
  @IsOptional()
  @IsString()
  salesperson?: string;

  @ApiProperty({ description: '收费开始日期', required: false })
  @IsOptional()
  @IsDateString()
  chargeDateStart?: string;

  @ApiProperty({ description: '收费结束日期', required: false })
  @IsOptional()
  @IsDateString()
  chargeDateEnd?: string;

  @ApiProperty({ description: '企业类型', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ description: '企业所在地', required: false })
  @IsOptional()
  @IsString()
  companyLocation?: string;

  @ApiProperty({ 
    description: '业务类型，支持多选，可以传递单个值或数组', 
    required: false,
    example: ['新增', '续费'] 
  })
  @IsOptional()
  businessType?: string | string[];

  @ApiProperty({ 
    description: '社保代理业务类型，支持多选，可以传递单个值或数组', 
    required: false,
    example: ['新增', '续费'] 
  })
  @IsOptional()
  socialInsuranceBusinessType?: string | string[];

  @ApiProperty({ description: '收费方式', required: false })
  @IsOptional()
  @IsString()
  chargeMethod?: string;

  @ApiProperty({ description: '收据编号', required: false })
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @ApiProperty({ description: '审核人', required: false })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiProperty({
    description: '创建开始日期（筛选创建时间开始日期）',
    required: false,
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description:
      '创建结束日期（筛选创建时间结束日期，当与startDate相同时，会查询整天的数据）',
    required: false,
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '审核开始日期（筛选审核时间开始日期）',
    required: false,
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  auditDateStart?: string;

  @ApiProperty({
    description:
      '审核结束日期（筛选审核时间结束日期，当与auditDateStart相同时，会查询整天的数据）',
    required: false,
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  auditDateEnd?: string;

  @ApiProperty({
    description: '业务查询筛选字段，支持多选，可以传递单个值或数组。根据不同搜索值筛选相应费用字段',
    required: false,
    example: ['代理费', '记账软件费'],
  })
  @IsOptional()
  businessInquiry?: string | string[];

  // 保留原有的分页参数
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;
}
