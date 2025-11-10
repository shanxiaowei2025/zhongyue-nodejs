import { ApiProperty } from '@nestjs/swagger';
import { FinancialSelfInspection } from '../entities/financial-self-inspection.entity';

export class FinancialSelfInspectionListResponseDto {
  @ApiProperty({
    description: '账务自查记录列表',
    type: [FinancialSelfInspection],
  })
  items: FinancialSelfInspection[];

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;

  @ApiProperty({ description: '创建数量（当前接口返回数据的总数量）' })
  createdCount: number;

  @ApiProperty({ description: '待整改数量（status字段值为0的总数量）' })
  pendingRectificationCount: number;

  @ApiProperty({ description: '抽查人确认数量（status字段值为2的总数量）' })
  inspectorApprovedCount: number;
}

