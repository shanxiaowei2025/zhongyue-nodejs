import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, ValidateIf } from 'class-validator';

export class FindExpensesDto {
  @ApiProperty({
    description: '企业名称',
    required: false,
    example: '某某科技有限公司',
  })
  @IsString({ message: '企业名称必须是字符串' })
  @ValidateIf((o) => !o.unifiedSocialCreditCode)
  @IsNotEmpty({ message: '企业名称和统一社会信用代码至少提供一个' })
  companyName?: string;

  @ApiProperty({
    description: '统一社会信用代码',
    required: false,
    example: '91110000123456789X',
  })
  @IsString({ message: '统一社会信用代码必须是字符串' })
  @ValidateIf((o) => !o.companyName)
  @IsNotEmpty({ message: '企业名称和统一社会信用代码至少提供一个' })
  unifiedSocialCreditCode?: string;
}
