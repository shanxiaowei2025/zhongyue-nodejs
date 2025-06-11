import { PartialType } from '@nestjs/swagger';
import { CreateFinancialSelfInspectionDto } from './create-financial-self-inspection.dto';
 
export class UpdateFinancialSelfInspectionDto extends PartialType(CreateFinancialSelfInspectionDto) {} 