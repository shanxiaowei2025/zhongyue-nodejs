import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateVoucherRecordMonthDto } from './create-voucher-record-month.dto';
 
export class UpdateVoucherRecordMonthDto extends PartialType(
  OmitType(CreateVoucherRecordMonthDto, ['yearRecordId', 'month'] as const)
) {} 