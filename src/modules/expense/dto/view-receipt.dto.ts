import { ApiProperty } from '@nestjs/swagger';

export class FeeItem {
  @ApiProperty({ description: '费用名称' })
  name: string;

  @ApiProperty({ description: '费用金额' })
  amount: number;
}

export class ViewReceiptDto {
  @ApiProperty({ description: '收据ID' })
  id: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '收费日期' })
  chargeDate: string;

  @ApiProperty({ description: '收据编号' })
  receiptNo: string;

  @ApiProperty({ description: '总费用' })
  totalFee: number;

  @ApiProperty({ description: '收费方式' })
  chargeMethod: string;

  @ApiProperty({ description: '收据备注' })
  remarks: string;
  
  @ApiProperty({ description: '费用明细列表', type: [FeeItem] })
  feeItems: FeeItem[];
} 