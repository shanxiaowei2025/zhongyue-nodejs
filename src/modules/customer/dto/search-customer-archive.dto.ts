import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCustomerArchiveDto {
  @ApiPropertyOptional({ 
    description: '企业名称（支持模糊查询），可选。如果不提供任何参数，将返回所有客户档案信息',
    example: '阿里巴巴'
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ 
    description: '统一社会信用代码（支持模糊查询），可选。如果不提供任何参数，将返回所有客户档案信息',
    example: '91330100MA27'
  })
  @IsOptional()
  @IsString()
  unifiedSocialCreditCode?: string;
} 