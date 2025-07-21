import { PartialType } from '@nestjs/swagger';
import { CreateSocialInsuranceDto } from './create-social-insurance.dto';

export class UpdateSocialInsuranceDto extends PartialType(CreateSocialInsuranceDto) {} 