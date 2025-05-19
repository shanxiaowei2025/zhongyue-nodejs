import { ApiProperty } from '@nestjs/swagger';

export class ViewReceiptDto {
  @ApiProperty({ description: '收据ID' })
  id: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '收费日期' })
  chargeDate: string;

  @ApiProperty({ description: '总费用' })
  totalFee: number;

  @ApiProperty({ description: '收费方式' })
  chargeMethod: string;

  @ApiProperty({ description: '收据备注' })
  remarks: string;
} 