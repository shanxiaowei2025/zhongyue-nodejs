// 包含数据库表对应的实体类
// - customer.entity.ts: 定义客户表的结构
// 主要功能：
// 1. 定义数据库表字段
// 2. 设置字段类型和属性
// 3. 定义表关系
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessStatus } from '../enums/customer.enum';
import { Clan } from './clan.entity';

@Entity('sys_customer')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, comment: '企业名称' })
  companyName: string;

  @Column({ nullable: true, comment: '归属地' })
  location: string;

  @Column({ nullable: true, comment: '顾问会计' })
  consultantAccountant: string;

  @Column({ nullable: true, comment: '记账会计' })
  bookkeepingAccountant: string;

  @Column({ nullable: true, comment: '开票员' })
  invoiceOfficer: string;

  @Column({ nullable: true, comment: '企业类型' })
  enterpriseType: string;

  @Column({ nullable: true, length: 100, comment: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @Column({ nullable: true, length: 60, comment: '税号' })
  taxNumber: string;

  @Column({ nullable: true, comment: '注册地址' })
  registeredAddress: string;

  @Column({ nullable: true, type: 'text', comment: '实际经营地址' })
  businessAddress: string;

  @Column({ nullable: true, comment: '所属分局' })
  taxBureau: string;

  @Column({
    nullable: true,
    type: 'json',
    comment: '实际负责人，数组对象[{姓名, 电话}]',
  })
  actualResponsibles: Array<{
    name?: string;
    phone?: string;
  }>;

  @Column({ nullable: true, comment: '实际负责人(备注)' })
  actualResponsibleRemark: string;

  @Column({ nullable: true, comment: '宗族ID' })
  clanId: number;

  @ManyToOne(() => Clan, { nullable: true })
  @JoinColumn({ name: 'clanId' })
  clan: Clan;

  @Column({ nullable: true, type: 'text', comment: '老板画像' })
  bossProfile: string;

  @Column({ nullable: true, type: 'text', comment: '企业画像' })
  enterpriseProfile: string;

  @Column({ nullable: true, comment: '行业大类' })
  industryCategory: string;

  @Column({ nullable: true, comment: '行业细分' })
  industrySubcategory: string;

  @Column({ nullable: true, comment: '是否有税收优惠', default: false })
  hasTaxBenefits: boolean;

  @Column({ nullable: true, comment: '工商公示密码' })
  businessPublicationPassword: string;

  @Column({ nullable: true, type: 'date', comment: '成立日期' })
  establishmentDate: Date;

  @Column({ nullable: true, type: 'date', comment: '营业执照期限' })
  licenseExpiryDate: Date;

  @Column({
    nullable: true,
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: '注册资金',
  })
  registeredCapital: number;

  @Column({ nullable: true, type: 'date', comment: '认缴到期日期' })
  capitalContributionDeadline: Date;

  @Column({ nullable: true, type: 'date', comment: '认缴到期日期2' })
  capitalContributionDeadline2: Date;

  @Column({
    nullable: true,
    type: 'json',
    comment: '已实缴金额，数组对象[{姓名, 出资日期, 出资金额, 图片}]',
  })
  paidInCapital: Array<{
    name?: string;
    contributionDate?: Date;
    amount?: number;
    images?: Record<string, any>;
  }>;

  @Column({
    nullable: true,
    type: 'json',
    comment: '法定代表人身份证的扫描件或照片地址',
  })
  legalPersonIdImages: Record<string, any>;

  @Column({
    nullable: true,
    type: 'json',
    comment: '其他相关人员身份证的扫描件或照片地址',
  })
  otherIdImages: Record<string, any>;

  @Column({
    nullable: true,
    type: 'json',
    comment: '企业营业执照的扫描件或照片地址',
  })
  businessLicenseImages: Record<string, any>;

  @Column({
    nullable: true,
    type: 'json',
    comment: '企业开户许可证的扫描件或照片地址',
  })
  bankAccountLicenseImages: Record<string, any>;

  @Column({
    nullable: true,
    type: 'json',
    comment: '其他补充的扫描件或照片地址',
  })
  supplementaryImages: Record<string, any>;

  @Column({
    nullable: true,
    type: 'json',
    comment:
      '行政许可，数组对象[{行政许可类型, 行政许可开始日期, 行政许可到期日期, 图片}]',
  })
  administrativeLicense: Array<{
    licenseType?: string;
    startDate?: Date; // 可为空
    expiryDate?: Date; // 可为空
    images?: Record<string, any>;
  }>;

  @Column({ nullable: true, comment: '对公开户行' })
  publicBank: string;

  @Column({ nullable: true, length: 255, comment: '开户行账号' })
  bankAccountNumber: string;

  @Column({ nullable: true, comment: '基本存款账户编号' })
  basicDepositAccountNumber: string;

  @Column({ nullable: true, comment: '一般户开户行' })
  generalAccountBank: string;

  @Column({ nullable: true, length: 255, comment: '一般户账号' })
  generalAccountNumber: string;

  @Column({ nullable: true, type: 'date', comment: '一般户开户时间' })
  generalAccountOpeningDate: Date;

  @Column({ nullable: true, type: 'date', comment: '对公开户时间' })
  publicBankOpeningDate: Date;

  @Column({ nullable: true, comment: '网银托管档案号' })
  onlineBankingArchiveNumber: string;

  @Column({ nullable: true, comment: '报税登录方式' })
  taxReportLoginMethod: string;

  @Column({ nullable: true, comment: '法人姓名' })
  legalRepresentativeName: string;

  @Column({ nullable: true, length: 60, comment: '法人电话' })
  legalRepresentativePhone: string;

  @Column({ nullable: true, length: 60, comment: '法人电话2' })
  legalRepresentativePhone2: string;

  @Column({ nullable: true, length: 100, comment: '法人身份证号' })
  legalRepresentativeId: string;

  @Column({ nullable: true, comment: '法人税务密码' })
  legalRepresentativeTaxPassword: string;

  @Column({ nullable: true, comment: '办税员' })
  taxOfficerName: string;

  @Column({ nullable: true, length: 60, comment: '办税员电话' })
  taxOfficerPhone: string;

  @Column({ nullable: true, length: 100, comment: '办税员身份证号' })
  taxOfficerId: string;

  @Column({ nullable: true, comment: '办税员税务密码' })
  taxOfficerTaxPassword: string;

  @Column({ nullable: true, comment: '开票软件' })
  invoicingSoftware: string;

  @Column({ nullable: true, type: 'text', comment: '开票注意事项' })
  invoicingNotes: string;

  @Column({ nullable: true, comment: '开票员姓名' })
  invoiceOfficerName: string;

  @Column({ nullable: true, length: 60, comment: '开票员电话' })
  invoiceOfficerPhone: string;

  @Column({ nullable: true, length: 100, comment: '开票员身份证号' })
  invoiceOfficerId: string;

  @Column({ nullable: true, comment: '开票员税务密码' })
  invoiceOfficerTaxPassword: string;

  @Column({ nullable: true, comment: '财务负责人' })
  financialContactName: string;

  @Column({ nullable: true, length: 60, comment: '财务负责人电话' })
  financialContactPhone: string;

  @Column({ nullable: true, length: 100, comment: '财务负责人身份证号' })
  financialContactId: string;

  @Column({ nullable: true, comment: '财务负责人税务密码' })
  financialContactTaxPassword: string;

  @Column({ nullable: true, type: 'text', comment: '税种' })
  taxCategories: string;

  @Column({ nullable: true, type: 'text', comment: '社保险种' })
  socialInsuranceTypes: string;

  @Column({ nullable: true, type: 'text', comment: '参保人员' })
  insuredPersonnel: string;

  @Column({ nullable: true, length: 100, comment: '三方协议扣款账户' })
  tripartiteAgreementAccount: string;

  @Column({ nullable: true, comment: '个税密码' })
  personalIncomeTaxPassword: string;

  @Column({ nullable: true, type: 'text', comment: '个税申报人员' })
  personalIncomeTaxStaff: string;

  @Column({ nullable: true, comment: '纸质资料档案编号' })
  paperArchiveNumber: string;

  @Column({ nullable: true, comment: '网银托管存放编号' })
  onlineBankingStorageNumber: string;

  @Column({ type: 'text', nullable: true, comment: '档案存放备注' })
  archiveStorageRemarks: string;

  @Column({ nullable: true, comment: '章存放编号' })
  sealStorageNumber: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
    comment: '企业当前的经营状态',
  })
  enterpriseStatus: string;
  // normal: '工商正常',
  // abnormal: '工商异常',
  // cancelled: '已注销',
  // revoked: '已吊销',

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
    comment: '客户分级',
  })
  customerLevel: string;

  @Column({
    nullable: true,
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: '费用贡献金额',
  })
  contributionAmount: number;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
    comment: '当前业务的状态',
  })
  businessStatus: string;

  @Column({ nullable: true, comment: '客户群' })
  customerGroup: string;

  @Column({ nullable: true, type: 'text', comment: '客户群备注' })
  customerGroupRemark: string;

  @Column({ nullable: true, comment: '维护代理端' })
  maintenanceAgent: string;

  @Column({ nullable: true, type: 'text', comment: '维护代理端备注' })
  maintenanceAgentRemark: string;

  @Column({ nullable: true, comment: '记账软件' })
  accountingSoftware: string;

  @Column({ nullable: true, type: 'text', comment: '记账软件备注' })
  accountingSoftwareRemark: string;

  @CreateDateColumn({
    nullable: true,
    comment: '记录的创建时间',
    type: 'timestamp',
    precision: 0,
  })
  createTime: Date;

  @UpdateDateColumn({
    nullable: true,
    comment: '记录的最后更新时间',
    type: 'timestamp',
    precision: 0,
  })
  updateTime: Date;

  @Column({ nullable: true, comment: '创建或最后修改该记录的用户' })
  submitter: string;

  @Column({ type: 'text', nullable: true, comment: '备注信息' })
  remarks: string;

  @ApiProperty({
    description: '跟进记录，JSON数组格式：[{"datetime": "ISO 8601格式", "text": "跟进记录内容"}]',
    required: false,
    example: [
      { datetime: '2025-09-26T10:30:00.000Z', text: '初次联系客户，了解基本需求' },
      { datetime: '2025-09-26T14:15:00.000Z', text: '发送了服务介绍资料' }
    ]
  })
  @Column({
    nullable: true,
    type: 'json',
    comment: '跟进记录，数组对象格式：[{"datetime": "ISO 8601格式", "text": "跟进记录内容"}]',
  })
  followUpRecords: Array<{
    datetime: string;
    text: string;
  }>;
}
