import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SalesBaseSalaryOverrideDto {
  @ApiProperty({ description: '销售专员姓名', example: '韦国辉' })
  @IsString()
  name: string;

  @ApiProperty({ description: '手工填写后的基础工资', example: 2000 })
  @IsNumber()
  baseSalary: number;
}

export class ConfirmAutoGenerateSalaryDto {
  @ApiPropertyOptional({
    description: '目标月份（格式：YYYY-MM-DD），不指定则默认为上个月的预览逻辑',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: '销售专员基础工资覆盖项',
    type: [SalesBaseSalaryOverrideDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesBaseSalaryOverrideDto)
  salesBaseSalaryOverrides?: SalesBaseSalaryOverrideDto[];
}
