import { ApiProperty } from '@nestjs/swagger';

export class FeeItem {
  @ApiProperty({ description: '费用名称' })
  name: string;

  @ApiProperty({ description: '费用金额' })
  amount: number;

  @ApiProperty({ description: '开始日期', required: false })
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  endDate?: string;
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

  @ApiProperty({ description: '变更业务列表', type: [String], required: false })
  changeBusiness: string[];

  @ApiProperty({ description: '行政许可列表', type: [String], required: false })
  administrativeLicense: string[];

  @ApiProperty({
    description: '其他业务(自有)列表',
    type: [String],
    required: false,
  })
  otherBusiness: string[];

  @ApiProperty({
    description: '其他业务(外包)列表',
    type: [String],
    required: false,
  })
  otherBusinessOutsourcing: string[];
}
