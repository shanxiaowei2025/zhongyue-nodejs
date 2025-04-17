// 创建客户时的数据结构
import { IsString, IsOptional, IsNumber, IsDate, IsObject, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnterpriseStatus, TaxRegistrationType, BusinessStatus } from '../enums/customer.enum';

export class CreateCustomerDto {
  @ApiProperty({ description: '企业名称' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: '归属地' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '顾问会计' })
  @IsString()
  @IsOptional()
  consultantAccountant?: string;

  @ApiPropertyOptional({ description: '记账会计' })
  @IsString()
  @IsOptional()
  bookkeepingAccountant?: string;

  @ApiPropertyOptional({ description: '企业类型' })
  @IsString()
  @IsOptional()
  enterpriseType?: string;

  @ApiPropertyOptional({ description: '税号' })
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiPropertyOptional({ description: '注册地址' })
  @IsString()
  @IsOptional()
  registeredAddress?: string;

  @ApiPropertyOptional({ description: '实际经营地址' })
  @IsString()
  @IsOptional()
  businessAddress?: string;

  @ApiPropertyOptional({ description: '所属分局' })
  @IsString()
  @IsOptional()
  taxBureau?: string;

  @ApiPropertyOptional({ description: '实际负责人姓名' })
  @IsString()
  @IsOptional()
  actualResponsibleName?: string;

  @ApiPropertyOptional({ description: '实际负责人电话' })
  @IsString()
  @IsOptional()
  actualResponsiblePhone?: string;

  @ApiPropertyOptional({ description: '同宗企业' })
  @IsString()
  @IsOptional()
  affiliatedEnterprises?: string;

  @ApiPropertyOptional({ description: '老板画像' })
  @IsString()
  @IsOptional()
  bossProfile?: string;

  @ApiPropertyOptional({ description: '企业画像' })
  @IsString()
  @IsOptional()
  enterpriseProfile?: string;

  @ApiPropertyOptional({ description: '行业大类' })
  @IsString()
  @IsOptional()
  industryCategory?: string;

  @ApiPropertyOptional({ description: '行业细分' })
  @IsString()
  @IsOptional()
  industrySubcategory?: string;

  @ApiPropertyOptional({ description: '是否有税收优惠' })
  @IsBoolean()
  @IsOptional()
  hasTaxBenefits?: boolean;

  @ApiPropertyOptional({ description: '工商公示密码' })
  @IsString()
  @IsOptional()
  businessPublicationPassword?: string;

  @ApiPropertyOptional({ description: '营业执照期限' })
  @IsDate()
  @IsOptional()
  licenseExpiryDate?: Date;

  @ApiPropertyOptional({ description: '注册资金' })
  @IsNumber()
  @IsOptional()
  registeredCapital?: number;

  @ApiPropertyOptional({ description: '认缴到期日期' })
  @IsDate()
  @IsOptional()
  capitalContributionDeadline?: Date;

  @ApiPropertyOptional({ description: '已实缴金额' })
  @IsNumber()
  @IsOptional()
  paidInCapital?: number;

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

  @ApiPropertyOptional({ description: '行政许可类型' })
  @IsString()
  @IsOptional()
  administrativeLicenseType?: string;

  @ApiPropertyOptional({ description: '行政许可到期日期' })
  @IsDate()
  @IsOptional()
  administrativeLicenseExpiryDate?: Date;

  @ApiPropertyOptional({ description: '对公开户行' })
  @IsString()
  @IsOptional()
  publicBank?: string;

  @ApiPropertyOptional({ description: '开户行账号' })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: '对公开户时间' })
  @IsDate()
  @IsOptional()
  publicBankOpeningDate?: Date;

  @ApiPropertyOptional({ description: '网银托管档案号' })
  @IsString()
  @IsOptional()
  onlineBankingArchiveNumber?: string;

  @ApiPropertyOptional({ description: '报税登录方式' })
  @IsString()
  @IsOptional()
  taxReportLoginMethod?: string;

  @ApiPropertyOptional({ description: '法人姓名' })
  @IsString()
  @IsOptional()
  legalRepresentativeName?: string;

  @ApiPropertyOptional({ description: '法人电话' })
  @IsString()
  @IsOptional()
  legalRepresentativePhone?: string;

  @ApiPropertyOptional({ description: '法人身份证号' })
  @IsString()
  @IsOptional()
  legalRepresentativeId?: string;

  @ApiPropertyOptional({ description: '法人税务密码' })
  @IsString()
  @IsOptional()
  legalRepresentativeTaxPassword?: string;

  @ApiPropertyOptional({ description: '办税员' })
  @IsString()
  @IsOptional()
  taxOfficerName?: string;

  @ApiPropertyOptional({ description: '办税员电话' })
  @IsString()
  @IsOptional()
  taxOfficerPhone?: string;

  @ApiPropertyOptional({ description: '办税员身份证号' })
  @IsString()
  @IsOptional()
  taxOfficerId?: string;

  @ApiPropertyOptional({ description: '办税员税务密码' })
  @IsString()
  @IsOptional()
  taxOfficerTaxPassword?: string;

  @ApiPropertyOptional({ description: '开票软件' })
  @IsString()
  @IsOptional()
  invoicingSoftware?: string;

  @ApiPropertyOptional({ description: '开票注意事项' })
  @IsString()
  @IsOptional()
  invoicingNotes?: string;

  @ApiPropertyOptional({ description: '开票员姓名' })
  @IsString()
  @IsOptional()
  invoiceOfficerName?: string;

  @ApiPropertyOptional({ description: '开票员电话' })
  @IsString()
  @IsOptional()
  invoiceOfficerPhone?: string;

  @ApiPropertyOptional({ description: '开票员身份证号' })
  @IsString()
  @IsOptional()
  invoiceOfficerId?: string;

  @ApiPropertyOptional({ description: '开票员税务密码' })
  @IsString()
  @IsOptional()
  invoiceOfficerTaxPassword?: string;

  @ApiPropertyOptional({ description: '财务负责人' })
  @IsString()
  @IsOptional()
  financialContactName?: string;

  @ApiPropertyOptional({ description: '财务负责人电话' })
  @IsString()
  @IsOptional()
  financialContactPhone?: string;

  @ApiPropertyOptional({ description: '财务负责人身份证号' })
  @IsString()
  @IsOptional()
  financialContactId?: string;

  @ApiPropertyOptional({ description: '财务负责人税务密码' })
  @IsString()
  @IsOptional()
  financialContactTaxPassword?: string;

  @ApiPropertyOptional({ description: '税种' })
  @IsString()
  @IsOptional()
  taxCategories?: string;

  @ApiPropertyOptional({ description: '社保险种' })
  @IsString()
  @IsOptional()
  socialInsuranceTypes?: string;

  @ApiPropertyOptional({ description: '参保人员' })
  @IsString()
  @IsOptional()
  insuredPersonnel?: string;

  @ApiPropertyOptional({ description: '三方协议扣款账户' })
  @IsString()
  @IsOptional()
  tripartiteAgreementAccount?: string;

  @ApiPropertyOptional({ description: '个税密码' })
  @IsString()
  @IsOptional()
  personalIncomeTaxPassword?: string;

  @ApiPropertyOptional({ description: '个税申报人员' })
  @IsString()
  @IsOptional()
  personalIncomeTaxStaff?: string;

  @ApiPropertyOptional({ description: '企业信息表编号' })
  @IsString()
  @IsOptional()
  enterpriseInfoSheetNumber?: string;

  @ApiPropertyOptional({ description: '章存放编号' })
  @IsString()
  @IsOptional()
  sealStorageNumber?: string;

  @ApiPropertyOptional({ 
    description: '企业当前的经营状态',
    enum: EnterpriseStatus 
  })
  @IsEnum(EnterpriseStatus)
  @IsOptional()
  enterpriseStatus?: EnterpriseStatus;

  @ApiPropertyOptional({ 
    description: '当前业务的状态',
    enum: BusinessStatus 
  })
  @IsEnum(BusinessStatus)
  @IsOptional()
  businessStatus?: BusinessStatus;

  @ApiPropertyOptional({ description: '创建或最后修改该记录的用户' })
  @IsString()
  @IsOptional()
  submitter?: string;

  @ApiPropertyOptional({ description: '备注信息' })
  @IsString()
  @IsOptional()
  remarks?: string;
}