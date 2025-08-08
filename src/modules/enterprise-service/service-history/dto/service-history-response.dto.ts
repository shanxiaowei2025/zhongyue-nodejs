import { ApiProperty } from '@nestjs/swagger';

class UpdatedFieldsDto {
  @ApiProperty({ description: '顾问会计', required: false })
  consultantAccountant?: string;

  @ApiProperty({ description: '记账会计', required: false })
  bookkeepingAccountant?: string;

  @ApiProperty({ description: '开票员', required: false })
  invoiceOfficer?: string;

  @ApiProperty({ description: '企业状态', required: false })
  enterpriseStatus?: string;

  @ApiProperty({ description: '工商状态', required: false })
  businessStatus?: string;
}

export class ServiceHistoryResponseDto {
  @ApiProperty({ description: '记录ID' })
  id: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiProperty({ description: '更新的字段', type: UpdatedFieldsDto })
  updatedFields: UpdatedFieldsDto;
}
