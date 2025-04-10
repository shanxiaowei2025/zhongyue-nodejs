// 创建客户时的数据结构
import { IsString, IsOptional, IsNumber, IsDate, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnterpriseStatus, TaxRegistrationType, BusinessStatus } from '../enums/customer.enum';

export class CreateCustomerDto {
  @ApiProperty({ description: '企业的法定名称' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: '日常业务联系人姓名' })
  @IsString()
  @IsOptional()
  dailyContact?: string;

  @ApiPropertyOptional({ description: '日常业务联系人的联系电话' })
  @IsString()
  @IsOptional()
  dailyContactPhone?: string;

  @ApiPropertyOptional({ description: '负责该客户的业务员姓名' })
  @IsString()
  @IsOptional()
  salesRepresentative?: string;

  @ApiPropertyOptional({ description: '企业的统一社会信用代码' })
  @IsString()
  @IsOptional()
  socialCreditCode?: string;

  @ApiPropertyOptional({ description: '企业所属的税务分局' })
  @IsString()
  @IsOptional()
  taxBureau?: string;

  @ApiPropertyOptional({ description: '客户的业务来源渠道' })
  @IsString()
  @IsOptional()
  businessSource?: string;

  @ApiPropertyOptional({ 
    description: '企业的税务登记类型',
    enum: TaxRegistrationType 
  })
  @IsEnum(TaxRegistrationType)
  @IsOptional()
  taxRegistrationType?: TaxRegistrationType;

  @ApiPropertyOptional({ description: '负责该企业的主管会计姓名' })
  @IsString()
  @IsOptional()
  chiefAccountant?: string;

  @ApiPropertyOptional({ description: '负责该企业的责任会计姓名' })
  @IsString()
  @IsOptional()
  responsibleAccountant?: string;

  @ApiPropertyOptional({ 
    description: '企业当前的经营状态',
    enum: EnterpriseStatus 
  })
  @IsEnum(EnterpriseStatus)
  @IsOptional()
  enterpriseStatus?: EnterpriseStatus;

  @ApiPropertyOptional({ description: '与该企业有关联的其他企业' })
  @IsString()
  @IsOptional()
  affiliatedEnterprises?: string;

  @ApiPropertyOptional({ description: '企业的主要经营业务' })
  @IsString()
  @IsOptional()
  mainBusiness?: string;

  @ApiPropertyOptional({ description: '企业老板的个人特征描述' })
  @IsString()
  @IsOptional()
  bossProfile?: string;

  @ApiPropertyOptional({ description: '与该企业沟通时需要注意的事项' })
  @IsString()
  @IsOptional()
  communicationNotes?: string;

  @ApiPropertyOptional({ description: '企业的经营范围描述' })
  @IsString()
  @IsOptional()
  businessScope?: string;

  @ApiPropertyOptional({ description: '企业的实际经营地址' })
  @IsString()
  @IsOptional()
  businessAddress?: string;

  @ApiPropertyOptional({ description: '企业的注册资本金额' })
  @IsNumber()
  @IsOptional()
  registeredCapital?: number;

  @ApiPropertyOptional({ description: '企业的成立日期' })
  @IsDate()
  @IsOptional()
  establishmentDate?: Date;

  @ApiPropertyOptional({ description: '营业执照的到期日期' })
  @IsDate()
  @IsOptional()
  licenseExpiryDate?: Date;

  @ApiPropertyOptional({ description: '注册资本认缴的截止日期' })
  @IsDate()
  @IsOptional()
  capitalContributionDeadline?: Date;

  @ApiPropertyOptional({ description: '企业的类型，如有限责任公司、股份有限公司等' })
  @IsString()
  @IsOptional()
  enterpriseType?: string;

  @ApiPropertyOptional({ description: '企业的股东信息' })
  @IsString()
  @IsOptional()
  shareholders?: string;

  @ApiPropertyOptional({ description: '企业的监事信息' })
  @IsString()
  @IsOptional()
  supervisors?: string;

  @ApiPropertyOptional({ description: '工商年检系统的登录密码' })
  @IsString()
  @IsOptional()
  annualInspectionPassword?: string;

  @ApiPropertyOptional({ description: '企业实际缴纳的注册资本金额' })
  @IsNumber()
  @IsOptional()
  paidInCapital?: number;

  @ApiPropertyOptional({ description: '企业获得的行政许可信息' })
  @IsString()
  @IsOptional()
  administrativeLicenses?: string;

  @ApiPropertyOptional({ description: '企业注册资本实缴的记录' })
  @IsString()
  @IsOptional()
  capitalContributionRecords?: string;

  @ApiPropertyOptional({ description: '企业的基本开户银行名称' })
  @IsString()
  @IsOptional()
  basicBank?: string;

  @ApiPropertyOptional({ description: '企业的基本开户银行账号' })
  @IsString()
  @IsOptional()
  basicBankAccount?: string;

  @ApiPropertyOptional({ description: '企业基本开户银行的行号' })
  @IsString()
  @IsOptional()
  basicBankNumber?: string;

  @ApiPropertyOptional({ description: '企业的一般开户银行名称' })
  @IsString()
  @IsOptional()
  generalBank?: string;

  @ApiPropertyOptional({ description: '企业的一般开户银行账号' })
  @IsString()
  @IsOptional()
  generalBankAccount?: string;

  @ApiPropertyOptional({ description: '企业一般开户银行的行号' })
  @IsString()
  @IsOptional()
  generalBankNumber?: string;

  @ApiPropertyOptional({ description: '企业是否办理了网上银行' })
  @IsString()
  @IsOptional()
  hasOnlineBanking?: string;

  @ApiPropertyOptional({ description: '企业的网银盾是否由我方托管' })
  @IsString()
  @IsOptional()
  isOnlineBankingCustodian?: string;

  @ApiPropertyOptional({ description: '企业法定代表人姓名' })
  @IsString()
  @IsOptional()
  legalRepresentativeName?: string;

  @ApiPropertyOptional({ description: '企业法定代表人的联系电话' })
  @IsString()
  @IsOptional()
  legalRepresentativePhone?: string;

  @ApiPropertyOptional({ description: '企业法定代表人的身份证号码' })
  @IsString()
  @IsOptional()
  legalRepresentativeId?: string;

  @ApiPropertyOptional({ description: '法定代表人的电子税务局登录密码' })
  @IsString()
  @IsOptional()
  legalRepresentativeTaxPassword?: string;

  @ApiPropertyOptional({ description: '企业财务负责人姓名' })
  @IsString()
  @IsOptional()
  financialContactName?: string;

  @ApiPropertyOptional({ description: '企业财务负责人的联系电话' })
  @IsString()
  @IsOptional()
  financialContactPhone?: string;

  @ApiPropertyOptional({ description: '企业财务负责人的身份证号码' })
  @IsString()
  @IsOptional()
  financialContactId?: string;

  @ApiPropertyOptional({ description: '财务负责人的电子税务局登录密码' })
  @IsString()
  @IsOptional()
  financialContactTaxPassword?: string;

  @ApiPropertyOptional({ description: '企业办税员姓名' })
  @IsString()
  @IsOptional()
  taxOfficerName?: string;

  @ApiPropertyOptional({ description: '企业办税员的联系电话' })
  @IsString()
  @IsOptional()
  taxOfficerPhone?: string;

  @ApiPropertyOptional({ description: '企业办税员的身份证号码' })
  @IsString()
  @IsOptional()
  taxOfficerId?: string;

  @ApiPropertyOptional({ description: '办税员的电子税务局登录密码' })
  @IsString()
  @IsOptional()
  taxOfficerTaxPassword?: string;

  @ApiPropertyOptional({ description: '用于税费扣缴的三方协议账户' })
  @IsString()
  @IsOptional()
  tripartiteAgreementAccount?: string;

  @ApiPropertyOptional({ description: '企业需要缴纳的税种' })
  @IsString()
  @IsOptional()
  taxCategories?: string;

  @ApiPropertyOptional({ description: '需要申报个人所得税的员工信息' })
  @IsString()
  @IsOptional()
  personalIncomeTaxStaff?: string;

  @ApiPropertyOptional({ description: '个人所得税申报系统的登录密码' })
  @IsString()
  @IsOptional()
  personalIncomeTaxPassword?: string;

  @ApiProperty({ description: '法定代表人身份证的扫描件或照片地址' })
  @IsObject()
  legalPersonIdImages: Record<string, any>;

  @ApiProperty({ description: '其他相关人员身份证的扫描件或照片地址' })
  @IsObject()
  otherIdImages: Record<string, any>;

  @ApiProperty({ description: '企业营业执照的扫描件或照片地址' })
  @IsObject()
  businessLicenseImages: Record<string, any>;

  @ApiProperty({ description: '企业开户许可证的扫描件或照片地址' })
  @IsObject()
  bankAccountLicenseImages: Record<string, any>;

  @ApiProperty({ description: '其他补充的扫描件或照片地址' })
  @IsObject()
  supplementaryImages: Record<string, any>;

  @ApiPropertyOptional({ description: '创建或最后修改该记录的用户' })
  @IsString()
  @IsOptional()
  submitter?: string;

  @ApiPropertyOptional({ 
    description: '当前业务的状态',
    enum: BusinessStatus 
  })
  @IsEnum(BusinessStatus)
  @IsOptional()
  businessStatus?: BusinessStatus;

  @ApiPropertyOptional({ description: '企业老板的姓名' })
  @IsString()
  @IsOptional()
  bossName?: string;
} 