import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateTaxVerificationDto {
  @ApiProperty({ description: '企业名称', example: 'XX有限公司' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码', example: '91110000000000000X', required: false })
  @IsString()
  @IsOptional()
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '所属分局', example: '海淀区税务局', required: false })
  @IsString()
  @IsOptional()
  taxBureau?: string;

  @ApiProperty({ description: '风险下发日期', example: '2023-10-15', required: false })
  @IsDateString()
  @IsOptional()
  riskIssuedDate?: string;

  @ApiProperty({ description: '触发风险原因', example: '未按时申报', required: false })
  @IsString()
  @IsOptional()
  riskReason?: string;

  @ApiProperty({ description: '风险发生日期', example: '2023-10-01', required: false })
  @IsDateString()
  @IsOptional()
  riskOccurredDate?: string;

  @ApiProperty({ description: '风险期责任会计', example: '张三', required: false })
  @IsString()
  @IsOptional()
  responsibleAccountant?: string;

  @ApiProperty({ description: '解决方法', example: '补充申报并缴纳罚款', required: false })
  @IsString()
  @IsOptional()
  solution?: string;

  @ApiProperty({ 
    description: '附件信息', 
    example: [{ name: '处理说明.pdf', url: '/uploads/file.pdf' }],
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string' }
      }
    }
  })
  @IsOptional()
  attachments?: any;
} 