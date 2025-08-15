import { PartialType } from '@nestjs/swagger';
import { CreateClanDto } from './create-clan.dto';

export class UpdateClanDto extends PartialType(CreateClanDto) {} 