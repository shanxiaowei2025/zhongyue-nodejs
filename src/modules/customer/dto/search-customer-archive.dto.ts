import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCustomerArchiveDto {
  @ApiPropertyOptional({
    description:
      '企业名称（支持模糊查询）。必须提供企业名称或统一社会信用代码中的至少一个参数',
    example: '阿里巴巴',
  })
  @ValidateIf(
    (o) =>
      !o.unifiedSocialCreditCode || o.unifiedSocialCreditCode.trim() === '',
  )
  @IsString({ message: '企业名称必须是字符串类型' })
  companyName?: string;

  @ApiPropertyOptional({
    description:
      '统一社会信用代码（支持模糊查询）。必须提供企业名称或统一社会信用代码中的至少一个参数',
    example: '91330100MA27',
  })
  @ValidateIf((o) => !o.companyName || o.companyName.trim() === '')
  @IsString({ message: '统一社会信用代码必须是字符串类型' })
  unifiedSocialCreditCode?: string;
}
