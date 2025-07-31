import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional, MinLength, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { CreateDepositDto } from './create-deposit.dto';

export class UpdateDepositDto extends PartialType(CreateDepositDto) {} 