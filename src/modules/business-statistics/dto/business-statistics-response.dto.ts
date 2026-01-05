import { ApiProperty } from '@nestjs/swagger';

export class BusinessStatisticsItemDto {
  @ApiProperty({
    description: '业务员姓名',
    example: '张三',
  })
  salesperson: string;

  @ApiProperty({
    description: '办照费用',
    example: 100.00,
  })
  licenseFee: number;

  @ApiProperty({
    description: '牌子费',
    example: 50.00,
  })
  brandFee: number;

  @ApiProperty({
    description: '备案章费用',
    example: 30.00,
  })
  recordSealFee: number;

  @ApiProperty({
    description: '一般刻章费用',
    example: 20.00,
  })
  generalSealFee: number;

  @ApiProperty({
    description: '代理费',
    example: 200.00,
  })
  agencyFee: number;

  @ApiProperty({
    description: '记账软件费',
    example: 150.00,
  })
  accountingSoftwareFee: number;

  @ApiProperty({
    description: '地址费',
    example: 80.00,
  })
  addressFee: number;

  @ApiProperty({
    description: '网银托管费',
    example: 120.00,
  })
  onlineBankingCustodyFee: number;

  @ApiProperty({
    description: '开票软件费',
    example: 100.00,
  })
  invoiceSoftwareFee: number;

  @ApiProperty({
    description: '社保代理费',
    example: 180.00,
  })
  socialInsuranceAgencyFee: number;

  @ApiProperty({
    description: '公积金代理费',
    example: 90.00,
  })
  housingFundAgencyFee: number;

  @ApiProperty({
    description: '统计局报表费',
    example: 60.00,
  })
  statisticalReportFee: number;

  @ApiProperty({
    description: '客户资料整理费',
    example: 40.00,
  })
  customerDataOrganizationFee: number;

  @ApiProperty({
    description: '变更费',
    example: 70.00,
  })
  changeFee: number;

  @ApiProperty({
    description: '行政许可费',
    example: 110.00,
  })
  administrativeLicenseFee: number;

  @ApiProperty({
    description: '其他业务费(基础)',
    example: 85.00,
  })
  otherBusinessFee: number;

  @ApiProperty({
    description: '其他业务外包费',
    example: 95.00,
  })
  otherBusinessOutsourcingFee: number;

  @ApiProperty({
    description: '其他业务专项费',
    example: 75.00,
  })
  otherBusinessSpecialFee: number;

  @ApiProperty({
    description: '费用总计',
    example: 1545.00,
  })
  totalFee: number;
}

export class BusinessStatisticsResponseDto {
  @ApiProperty({
    description: '统计数据列表',
    type: [BusinessStatisticsItemDto],
  })
  data: BusinessStatisticsItemDto[];

  @ApiProperty({
    description: '总计数据',
    type: BusinessStatisticsItemDto,
  })
  summary: BusinessStatisticsItemDto;

  @ApiProperty({
    description: '数据总数',
    example: 10,
  })
  total: number;
}
