import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class QueryContractDto {
  @ApiProperty({ description: '合同编号', required: false })
  @IsString()
  @IsOptional()
  contractNumber?: string;

  @ApiProperty({ description: '甲方公司', required: false })
  @IsString()
  @IsOptional()
  partyACompany?: string;

  @ApiProperty({ description: '甲方统一社会信用代码', required: false })
  @IsString()
  @IsOptional()
  partyACreditCode?: string;

  @ApiProperty({ description: '合同类型', required: false })
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiProperty({ description: '签署方', required: false })
  @IsString()
  @IsOptional()
  signatory?: string;

  @ApiProperty({ description: '合同状态', required: false })
  @IsString()
  @IsOptional()
  contractStatus?: string;

  @ApiProperty({ description: '甲方签订日期-开始', required: false })
  @IsDateString()
  @IsOptional()
  partyASignDateStart?: string;

  @ApiProperty({ description: '甲方签订日期-结束', required: false })
  @IsDateString()
  @IsOptional()
  partyASignDateEnd?: string;

  @ApiProperty({ description: '创建日期-开始', required: false })
  @IsDateString()
  @IsOptional()
  createTimeStart?: string;

  @ApiProperty({ description: '创建日期-结束', required: false })
  @IsDateString()
  @IsOptional()
  createTimeEnd?: string;
} 