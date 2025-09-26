import { ApiProperty } from '@nestjs/swagger';
import { FollowUpRecordItemDto } from './create-customer.dto';

export class CustomerResponseDto {
  @ApiProperty({ description: '客户ID' })
  id: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '归属地', required: false })
  location?: string;

  @ApiProperty({ description: '顾问会计', required: false })
  consultantAccountant?: string;

  @ApiProperty({ description: '记账会计', required: false })
  bookkeepingAccountant?: string;

  @ApiProperty({ description: '开票员', required: false })
  invoiceOfficer?: string;

  @ApiProperty({ description: '企业类型', required: false })
  enterpriseType?: string;

  @ApiProperty({ description: '统一社会信用代码', required: false })
  unifiedSocialCreditCode?: string;

  @ApiProperty({ description: '税号', required: false })
  taxNumber?: string;

  @ApiProperty({ description: '注册地址', required: false })
  registeredAddress?: string;

  @ApiProperty({ description: '实际经营地址', required: false })
  businessAddress?: string;

  @ApiProperty({ description: '所属分局', required: false })
  taxBureau?: string;

  @ApiProperty({ 
    description: '实际负责人',
    type: [Object],
    required: false 
  })
  actualResponsibles?: Array<{
    name?: string;
    phone?: string;
  }>;

  @ApiProperty({ description: '实际负责人(备注)', required: false })
  actualResponsibleRemark?: string;

  @ApiProperty({ description: '宗族ID', required: false })
  clanId?: number;

  @ApiProperty({ description: '老板画像', required: false })
  bossProfile?: string;

  @ApiProperty({ description: '法定代表人', required: false })
  legalRepresentative?: string;

  @ApiProperty({ description: '注册资本', required: false })
  registeredCapital?: string;

  @ApiProperty({ description: '成立日期', required: false })
  establishmentDate?: Date;

  @ApiProperty({ description: '企业状态', required: false })
  enterpriseStatus?: string;

  @ApiProperty({ description: '业务状态', required: false })
  businessStatus?: string;

  @ApiProperty({ description: '客户级别', required: false })
  customerLevel?: string;

  @ApiProperty({ description: '行业大类', required: false })
  industryCategory?: string;

  @ApiProperty({ description: '备注', required: false })
  remarks?: string;

  @ApiProperty({ 
    description: '跟进记录',
    type: [FollowUpRecordItemDto],
    required: false,
    example: [
      {
        datetime: "2025-09-26T10:30:00.000Z",
        text: "初次联系客户，了解基本需求"
      }
    ]
  })
  followUpRecords?: FollowUpRecordItemDto[];

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;
}

export class CustomerListResponseDto {
  @ApiProperty({ description: '客户列表', type: [CustomerResponseDto] })
  data: CustomerResponseDto[];

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
} 