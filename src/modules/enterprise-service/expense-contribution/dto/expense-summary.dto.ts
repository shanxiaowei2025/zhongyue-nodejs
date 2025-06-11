import { ApiProperty } from '@nestjs/swagger';

export class ExpenseItemDto {
  @ApiProperty({ description: '费用ID' })
  id: number;

  @ApiProperty({ description: '收费日期' })
  chargeDate: string;

  @ApiProperty({ description: '收据编号' })
  receiptNo: string;

  @ApiProperty({ description: '费用金额' })
  totalFee: number;
}

export class ExpenseSummaryDto {
  @ApiProperty({ description: '费用列表', type: [ExpenseItemDto] })
  expenses: ExpenseItemDto[];

  @ApiProperty({ description: '费用总计' })
  totalAmount: number;
} 