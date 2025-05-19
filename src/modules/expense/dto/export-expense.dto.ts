import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportExpenseDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: '状态：0-未审核，1-已审核，2-已退回', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '业务员', required: false })
  @IsOptional()
  @IsString()
  salesperson?: string;

  @ApiProperty({ description: '收费开始日期', required: false })
  @IsOptional()
  @IsDateString()
  chargeDateStart?: string;

  @ApiProperty({ description: '收费结束日期', required: false })
  @IsOptional()
  @IsDateString()
  chargeDateEnd?: string;
  
  @ApiProperty({ description: '企业类型', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;
  
  @ApiProperty({ description: '企业归属地', required: false })
  @IsOptional()
  @IsString()
  companyLocation?: string;
  
  @ApiProperty({ description: '业务类型', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;
}
