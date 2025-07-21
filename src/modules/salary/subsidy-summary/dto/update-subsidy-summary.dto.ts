import { PartialType } from '@nestjs/swagger';
import { CreateSubsidySummaryDto } from './create-subsidy-summary.dto';

export class UpdateSubsidySummaryDto extends PartialType(CreateSubsidySummaryDto) {} 