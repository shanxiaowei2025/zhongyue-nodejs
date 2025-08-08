import { IsDate, IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSocialInsuranceDto {
  @ApiProperty({ description: '姓名', example: '张三', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '个人医疗', required: false, example: 100.0 })
  @IsNumber()
  @IsOptional()
  personalMedical?: number;

  @ApiProperty({ description: '个人养老', required: false, example: 200.0 })
  @IsNumber()
  @IsOptional()
  personalPension?: number;

  @ApiProperty({ description: '个人失业', required: false, example: 50.0 })
  @IsNumber()
  @IsOptional()
  personalUnemployment?: number;

  @ApiProperty({ description: '社保个人合计', required: false, example: 350.0 })
  @IsNumber()
  @IsOptional()
  personalTotal?: number;

  @ApiProperty({ description: '公司医疗', required: false, example: 200.0 })
  @IsNumber()
  @IsOptional()
  companyMedical?: number;

  @ApiProperty({ description: '公司养老', required: false, example: 400.0 })
  @IsNumber()
  @IsOptional()
  companyPension?: number;

  @ApiProperty({ description: '公司失业', required: false, example: 100.0 })
  @IsNumber()
  @IsOptional()
  companyUnemployment?: number;

  @ApiProperty({ description: '公司工伤', required: false, example: 50.0 })
  @IsNumber()
  @IsOptional()
  companyInjury?: number;

  @ApiProperty({ description: '公司承担合计', required: false, example: 750.0 })
  @IsNumber()
  @IsOptional()
  companyTotal?: number;

  @ApiProperty({ description: '总合计', required: false, example: 1100.0 })
  @IsNumber()
  @IsOptional()
  grandTotal?: number;

  @ApiProperty({ description: '年月', example: '2023-06-01', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  yearMonth?: Date;

  @ApiProperty({ description: '备注', required: false, example: '备注信息' })
  @IsOptional()
  @IsString()
  remark?: string;
}
