import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAgencyDatesDto {
  @ApiProperty({ 
    description: '企业名称', 
    required: false, 
    example: '北京科技有限公司'
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ 
    description: '统一社会信用代码', 
    required: false, 
    example: '91110105MA01ABCDEF'
  })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;
} 