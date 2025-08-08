import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreatePerformanceCommissionDto {
  @ApiProperty({ description: 'P级', example: 'P1', required: false })
  @IsOptional()
  @IsString()
  pLevel?: string;

  @ApiProperty({ description: '档级', example: '一档', required: false })
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiProperty({ description: '户数', example: '1-5户', required: false })
  @IsOptional()
  @IsString()
  householdCount?: string;

  @ApiProperty({ description: '底薪(元)', example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiProperty({ description: '绩效(元)', example: 3000, required: false })
  @IsOptional()
  @IsNumber()
  performance?: number;
}
