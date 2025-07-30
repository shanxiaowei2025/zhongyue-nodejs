import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateFinancialSelfInspectionDto {
  @ApiProperty({ description: '抽查日期', required: false, example: '2023-01-01' })
  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @ApiProperty({ description: '企业名称', required: false, example: '某某科技有限公司' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false, example: '91110000123456789X' })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '记账会计', required: false, example: '张三' })
  @IsOptional()
  @IsString()
  bookkeepingAccountant?: string;

  @ApiProperty({ description: '顾问会计', required: false, example: '李四' })
  @IsOptional()
  @IsString()
  consultantAccountant?: string;

  @ApiProperty({ description: '抽查人', required: false, example: '王五' })
  @IsOptional()
  @IsString()
  inspector?: string;

  @ApiProperty({ description: '问题', required: false, example: '发票未及时入账' })
  @IsOptional()
  @IsString()
  problem?: string;

  @ApiProperty({ description: '解决方案', required: false, example: '补充入账' })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiProperty({ description: '整改完成日期', required: false, example: '2023-02-01' })
  @IsOptional()
  @IsDateString()
  rectificationCompletionDate?: string;

  @ApiProperty({ description: '整改结果', required: false, example: '已完成所有账务调整' })
  @IsOptional()
  @IsString()
  rectificationResult?: string;

  @ApiProperty({ description: '复查人', required: false, example: '赵六' })
  @IsOptional()
  @IsString()
  reviewer?: string;

  @ApiProperty({ description: '复查问题', required: false, example: '仍有部分发票未入账' })
  @IsOptional()
  @IsString()
  reviewerProblem?: string;

  @ApiProperty({ description: '复查解决方案', required: false, example: '再次补充入账' })
  @IsOptional()
  @IsString()
  reviewerSolution?: string;

  @ApiProperty({ description: '复查人确认', required: false, example: '2023-03-15' })
  @IsOptional()
  @IsDateString()
  reviewerConfirmation?: string;

  @ApiProperty({ description: '复查备注', required: false, example: '已与客户再次确认' })
  @IsOptional()
  @IsString()
  reviewerRemarks?: string;

  @ApiProperty({ description: '抽查人确认', required: false, example: '2023-02-15' })
  @IsOptional()
  @IsDateString()
  inspectorConfirmation?: string;

  @ApiProperty({ description: '备注', required: false, example: '已与客户沟通' })
  @IsOptional()
  @IsString()
  remarks?: string;
} 