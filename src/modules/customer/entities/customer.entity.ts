// 包含数据库表对应的实体类
// - customer.entity.ts: 定义客户表的结构
// 主要功能：
// 1. 定义数据库表字段
// 2. 设置字段类型和属性
// 3. 定义表关系
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EnterpriseStatus, TaxRegistrationType, BusinessStatus } from '../enums/customer.enum';

@Entity('sys_customer')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, comment: '企业的法定名称' })
  companyName: string;

  @Column({ nullable: true, comment: '日常业务联系人姓名' })
  dailyContact: string;

  @Column({ nullable: true, comment: '日常业务联系人的联系电话' })
  dailyContactPhone: string;

  @Column({ nullable: true, comment: '负责该客户的业务员姓名' })
  salesRepresentative: string;

  @Column({ nullable: true, length: 18, comment: '企业的统一社会信用代码' })
  socialCreditCode: string;

  @Column({ nullable: true, comment: '企业所属的税务分局' })
  taxBureau: string;

  @Column({ nullable: true, comment: '客户的业务来源渠道' })
  businessSource: string;

  @Column({ 
    type: 'enum', 
    enum: TaxRegistrationType,
    default: TaxRegistrationType.GENERAL,
    comment: '企业的税务登记类型' 
  })
  taxRegistrationType: TaxRegistrationType;

  @Column({ nullable: true, comment: '负责该企业的主管会计姓名' })
  chiefAccountant: string;

  @Column({ nullable: true, comment: '负责该企业的责任会计姓名' })
  responsibleAccountant: string;

  @Column({ 
    type: 'enum', 
    enum: EnterpriseStatus,
    default: EnterpriseStatus.ACTIVE,
    comment: '企业当前的经营状态' 
  })
  enterpriseStatus: EnterpriseStatus;

  @Column({ type: 'text', nullable: true, comment: '与该企业有关联的其他企业' })
  affiliatedEnterprises: string;

  @Column({ type: 'text', nullable: true, comment: '企业的主要经营业务' })
  mainBusiness: string;

  @Column({ type: 'text', nullable: true, comment: '企业老板的个人特征描述' })
  bossProfile: string;

  @Column({ type: 'text', nullable: true, comment: '与该企业沟通时需要注意的事项' })
  communicationNotes: string;

  @Column({ type: 'text', nullable: true, comment: '企业的经营范围描述' })
  businessScope: string;

  @Column({ type: 'text', nullable: true, comment: '企业的实际经营地址' })
  businessAddress: string;

  @Column({ type: 'decimal', precision: 15, scale: 0, nullable: true, comment: '企业的注册资本金额' })
  registeredCapital: number;

  @Column({ type: 'date', nullable: true, comment: '企业的成立日期' })
  establishmentDate: Date;

  @Column({ type: 'date', nullable: true, comment: '营业执照的到期日期' })
  licenseExpiryDate: Date;

  @Column({ type: 'date', nullable: true, comment: '注册资本认缴的截止日期' })
  capitalContributionDeadline: Date;

  @Column({ nullable: true, comment: '企业的类型，如有限责任公司、股份有限公司等' })
  enterpriseType: string;

  @Column({ type: 'text', nullable: true, comment: '企业的股东信息' })
  shareholders: string;

  @Column({ type: 'text', nullable: true, comment: '企业的监事信息' })
  supervisors: string;

  @Column({ nullable: true, comment: '工商年检系统的登录密码' })
  annualInspectionPassword: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '企业实际缴纳的注册资本金额' })
  paidInCapital: number;

  @Column({ type: 'text', nullable: true, comment: '企业获得的行政许可信息' })
  administrativeLicenses: string;

  @Column({ type: 'text', nullable: true, comment: '企业注册资本实缴的记录' })
  capitalContributionRecords: string;

  @Column({ nullable: true, comment: '企业的基本开户银行名称' })
  basicBank: string;

  @Column({ nullable: true, length: 30, comment: '企业的基本开户银行账号' })
  basicBankAccount: string;

  @Column({ nullable: true, length: 20, comment: '企业基本开户银行的行号' })
  basicBankNumber: string;

  @Column({ nullable: true, comment: '企业的一般开户银行名称' })
  generalBank: string;

  @Column({ nullable: true, length: 30, comment: '企业的一般开户银行账号' })
  generalBankAccount: string;

  @Column({ nullable: true, length: 20, comment: '企业一般开户银行的行号' })
  generalBankNumber: string;

  @Column({ nullable: true, comment: '企业是否办理了网上银行' })
  hasOnlineBanking: string;

  @Column({ nullable: true, comment: '企业的网银盾是否由我方托管' })
  isOnlineBankingCustodian: string;

  @Column({ nullable: true, comment: '企业法定代表人姓名' })
  legalRepresentativeName: string;

  @Column({ nullable: true, length: 20, comment: '企业法定代表人的联系电话' })
  legalRepresentativePhone: string;

  @Column({ nullable: true, length: 18, comment: '企业法定代表人的身份证号码' })
  legalRepresentativeId: string;

  @Column({ nullable: true, comment: '法定代表人的电子税务局登录密码' })
  legalRepresentativeTaxPassword: string;

  @Column({ nullable: true, comment: '企业财务负责人姓名' })
  financialContactName: string;

  @Column({ nullable: true, length: 20, comment: '企业财务负责人的联系电话' })
  financialContactPhone: string;

  @Column({ nullable: true, length: 18, comment: '企业财务负责人的身份证号码' })
  financialContactId: string;

  @Column({ nullable: true, comment: '财务负责人的电子税务局登录密码' })
  financialContactTaxPassword: string;

  @Column({ nullable: true, comment: '企业办税员姓名' })
  taxOfficerName: string;

  @Column({ nullable: true, length: 20, comment: '企业办税员的联系电话' })
  taxOfficerPhone: string;

  @Column({ nullable: true, length: 18, comment: '企业办税员的身份证号码' })
  taxOfficerId: string;

  @Column({ nullable: true, comment: '办税员的电子税务局登录密码' })
  taxOfficerTaxPassword: string;

  @Column({ nullable: true, length: 30, comment: '用于税费扣缴的三方协议账户' })
  tripartiteAgreementAccount: string;

  @Column({ type: 'text', nullable: true, comment: '企业需要缴纳的税种' })
  taxCategories: string;

  @Column({ type: 'text', nullable: true, comment: '需要申报个人所得税的员工信息' })
  personalIncomeTaxStaff: string;

  @Column({ nullable: true, comment: '个人所得税申报系统的登录密码' })
  personalIncomeTaxPassword: string;

  @Column({ type: 'json', comment: '法定代表人身份证的扫描件或照片地址' })
  legalPersonIdImages: Record<string, any>;

  @Column({ type: 'json', comment: '其他相关人员身份证的扫描件或照片地址' })
  otherIdImages: Record<string, any>;

  @Column({ type: 'json', comment: '企业营业执照的扫描件或照片地址' })
  businessLicenseImages: Record<string, any>;

  @Column({ type: 'json', comment: '企业开户许可证的扫描件或照片地址' })
  bankAccountLicenseImages: Record<string, any>;

  @Column({ type: 'json', comment: '其他补充的扫描件或照片地址' })
  supplementaryImages: Record<string, any>;

  @CreateDateColumn({ comment: '记录的创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '记录的最后更新时间' })
  updateTime: Date;

  @Column({ nullable: true, comment: '创建或最后修改该记录的用户' })
  submitter: string;

  @Column({ 
    type: 'enum', 
    enum: BusinessStatus,
    default: BusinessStatus.NORMAL,
    comment: '当前业务的状态' 
  })
  businessStatus: BusinessStatus;

  @Column({ nullable: true, comment: '企业老板的姓名' })
  bossName: string;
} 