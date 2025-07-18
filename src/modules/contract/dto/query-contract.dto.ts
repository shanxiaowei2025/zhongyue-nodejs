import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryContractDto {
  @ApiProperty({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  pageSize?: number;

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

  @ApiProperty({ 
    description: '甲方签订日期-开始（当与甲方签订日期-结束相同时，会查询整天的数据）', 
    required: false,
    example: '2023-01-01'
  })
  @IsDateString()
  @IsOptional()
  partyASignDateStart?: string;

  @ApiProperty({ 
    description: '甲方签订日期-结束（当与甲方签订日期-开始相同时，会查询整天的数据）', 
    required: false,
    example: '2023-01-31'
  })
  @IsDateString()
  @IsOptional()
  partyASignDateEnd?: string;

  @ApiProperty({ 
    description: '创建日期-开始（当与创建日期-结束相同时，会查询整天的数据）', 
    required: false,
    example: '2023-01-01'
  })
  @IsDateString()
  @IsOptional()
  createTimeStart?: string;

  @ApiProperty({ 
    description: '创建日期-结束（当与创建日期-开始相同时，会查询整天的数据）', 
    required: false,
    example: '2023-01-31'
  })
  @IsDateString()
  @IsOptional()
  createTimeEnd?: string;

  @ApiProperty({ description: '合同金额', required: false })
  @IsString()
  @IsOptional()
  contractAmount?: string;

  @ApiProperty({ description: '甲方法定代表人', required: false })
  @IsString()
  @IsOptional()
  partyALegalRepresentative?: string;

  @ApiProperty({ description: '甲方联系人', required: false })
  @IsString()
  @IsOptional()
  partyAContact?: string;

  @ApiProperty({ description: '甲方联系电话', required: false })
  @IsString()
  @IsOptional()
  partyAPhone?: string;

  @ApiProperty({ description: '甲方地址', required: false })
  @IsString()
  @IsOptional()
  partyAAddress?: string;

  @ApiProperty({ description: '乙方签订人', required: false })
  @IsString()
  @IsOptional()
  partyBSigner?: string;

  @ApiProperty({ description: '委托开始日期', required: false })
  @IsDateString()
  @IsOptional()
  entrustmentStartDate?: string;

  @ApiProperty({ description: '委托结束日期', required: false })
  @IsDateString()
  @IsOptional()
  entrustmentEndDate?: string;
} 