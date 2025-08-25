import { PartialType } from '@nestjs/swagger';
import { CreateVoucherRecordYearDto } from './create-voucher-record-year.dto';
 
export class UpdateVoucherRecordYearDto extends PartialType(CreateVoucherRecordYearDto) {} 