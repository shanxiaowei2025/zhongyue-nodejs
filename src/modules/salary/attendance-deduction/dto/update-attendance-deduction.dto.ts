import { PartialType } from '@nestjs/swagger';
import { CreateAttendanceDeductionDto } from './create-attendance-deduction.dto';
 
export class UpdateAttendanceDeductionDto extends PartialType(CreateAttendanceDeductionDto) {} 