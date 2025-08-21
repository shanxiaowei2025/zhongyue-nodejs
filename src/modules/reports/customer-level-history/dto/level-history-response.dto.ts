import { ApiProperty } from '@nestjs/swagger';

export class LevelHistoryItemDto {
  @ApiProperty({ description: '历史记录ID' })
  id: number;

  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '变更前的客户等级' })
  previousLevel: string;

  @ApiProperty({ description: '变更后的客户等级' })
  currentLevel: string;

  @ApiProperty({ description: '等级变更日期' })
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

export class LevelHistoryPaginationDto {
  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class LevelHistoryStatsDto {
  @ApiProperty({ description: '等级变更总次数' })
  totalChanges: number;

  @ApiProperty({ description: '涉及客户数量' })
  affectedCustomers: number;

  @ApiProperty({ description: '最近变更日期' })
  lastChangeDate: string;
}

export class LevelHistoryResponseDto {
  @ApiProperty({ description: '等级历史记录列表', type: [LevelHistoryItemDto] })
  data: LevelHistoryItemDto[];

  @ApiProperty({ description: '分页信息', type: LevelHistoryPaginationDto })
  pagination: LevelHistoryPaginationDto;

  @ApiProperty({ description: '统计信息', type: LevelHistoryStatsDto })
  stats: LevelHistoryStatsDto;
}

export class CustomerLevelAtTimeDto {
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '指定时间点的客户等级' })
  levelAtTime: string;

  @ApiProperty({ description: '等级生效日期' })
  effectiveDate: string;

  @ApiProperty({ description: '是否为当前等级' })
  isCurrentLevel: boolean;
} 