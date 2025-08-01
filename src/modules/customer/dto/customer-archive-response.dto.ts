import { ApiProperty } from '@nestjs/swagger';

export class CustomerArchiveResponseDto {
  @ApiProperty({ 
    description: '企业名称',
    example: '阿里巴巴网络技术有限公司'
  })
  companyName: string;

  @ApiProperty({ 
    description: '统一社会信用代码',
    example: '91330100MA27'
  })
  unifiedSocialCreditCode: string;

  @ApiProperty({ 
    description: '章存放编号',
    example: 'SEAL001'
  })
  sealStorageNumber: string;

  @ApiProperty({ 
    description: '网银托管档案号',
    example: 'BANK001'
  })
  onlineBankingArchiveNumber: string;

  @ApiProperty({ 
    description: '纸质资料档案编号',
    example: 'PAPER001'
  })
  paperArchiveNumber: string;

  @ApiProperty({ 
    description: '档案存放备注',
    example: '存放在A区1号柜'
  })
  archiveStorageRemarks: string;
} 