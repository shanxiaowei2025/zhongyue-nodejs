import { IsString, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryMaxDatesDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.unifiedSocialCreditCode)
  companyName?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.companyName)
  unifiedSocialCreditCode?: string;
}
