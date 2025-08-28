import { ApiProperty } from '@nestjs/swagger';

export class StatusHistoryItemDto {
  @ApiProperty({ description: '记录ID' })
  id: number;

  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '变更前的企业状态' })
  previousEnterpriseStatus: string;

  @ApiProperty({ description: '变更后的企业状态' })
  currentEnterpriseStatus: string;

  @ApiProperty({ description: '变更前的业务状态' })
  previousBusinessStatus: string;

  @ApiProperty({ description: '变更后的业务状态' })
  currentBusinessStatus: string;

  @ApiProperty({ description: '状态变更日期时间' })
  changeDate: string;

  @ApiProperty({ description: '变更原因' })
  changeReason: string;

  @ApiProperty({ description: '操作人员' })
  changedBy: string;

  @ApiProperty({ description: '备注信息' })
  remarks: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class StatusHistoryPaginationDto {
  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  limit: number;

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class StatusHistoryStatsDto {
  @ApiProperty({ description: '总变更次数' })
  totalChanges: number;

  @ApiProperty({ description: '流失客户数量' })
  churnedCustomers: number;

  @ApiProperty({ description: '恢复客户数量' })
  recoveredCustomers: number;

  @ApiProperty({ description: '企业状态变更统计' })
  enterpriseStatusChanges: Array<{
    status: string;
    count: number;
  }>;

  @ApiProperty({ description: '业务状态变更统计' })
  businessStatusChanges: Array<{
    status: string;
    count: number;
  }>;
}

export class StatusHistoryResponseDto {
  @ApiProperty({ description: '状态历史记录列表', type: [StatusHistoryItemDto] })
  data: StatusHistoryItemDto[];

  @ApiProperty({ description: '分页信息', type: StatusHistoryPaginationDto })
  pagination: StatusHistoryPaginationDto;

  @ApiProperty({ description: '统计信息', type: StatusHistoryStatsDto })
  stats: StatusHistoryStatsDto;
}

export class CustomerStatusAtTimeDto {
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '指定时间点的企业状态' })
  enterpriseStatus: string;

  @ApiProperty({ description: '指定时间点的业务状态' })
  businessStatus: string;

  @ApiProperty({ description: '状态生效日期' })
  effectiveDate: string;

  @ApiProperty({ description: '是否为流失客户' })
  isChurned: boolean;
} 