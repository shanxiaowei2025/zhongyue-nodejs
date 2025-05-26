import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_contract')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, comment: '合同编号' })
  contractNumber: string;
  
  @Column({ nullable: true, comment: '签署方' })
  signatory: string;
  
  @Column({ nullable: true, comment: '合同类型' })
  contractType: string;
  
  @Column({ nullable: true, comment: '甲方公司' })
  partyACompany: string;
  
  @Column({ nullable: true, comment: '甲方统一社会信用代码' })
  partyACreditCode: string;
  
  @Column({ nullable: true, comment: '甲方法人' })
  partyALegalPerson: string;
  
  @Column({ nullable: true, comment: '甲方邮编' })
  partyAPostalCode: string;
  
  @Column({ nullable: true, comment: '甲方通讯地址' })
  partyAAddress: string;
  
  @Column({ nullable: true, comment: '甲方联系人' })
  partyAContact: string;
  
  @Column({ nullable: true, comment: '甲方联系电话' })
  partyAPhone: string;
  
  @Column({ nullable: true, comment: '乙方公司' })
  partyBCompany: string;
  
  @Column({ nullable: true, comment: '乙方统一社会信用代码' })
  partyBCreditCode: string;
  
  @Column({ nullable: true, comment: '乙方法人' })
  partyBLegalPerson: string;
  
  @Column({ nullable: true, comment: '乙方邮编' })
  partyBPostalCode: string;
  
  @Column({ nullable: true, comment: '乙方通讯地址' })
  partyBAddress: string;
  
  @Column({ nullable: true, comment: '乙方联系人' })
  partyBContact: string;
  
  @Column({ nullable: true, comment: '乙方联系电话' })
  partyBPhone: string;
  
  @Column({ nullable: true, comment: '咨询电话' })
  consultPhone: string;
  
  @Column({ type: 'json', nullable: true, comment: '工商-设立' })
  businessEstablishment: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '工商-设立地址' })
  businessEstablishmentAddress: string;
  
  @Column({ type: 'json', nullable: true, comment: '工商-变更' })
  businessChange: Array<Record<string, any>>;
  
  @Column({ type: 'json', nullable: true, comment: '工商-注销' })
  businessCancellation: Array<Record<string, any>>;
  
  @Column({ type: 'json', nullable: true, comment: '工商-其他' })
  businessOther: Array<Record<string, any>>;
  
  @Column({ type: 'json', nullable: true, comment: '工商-物料' })
  businessMaterials: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '工商-备注' })
  businessRemark: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '工商-服务费' })
  businessServiceFee: number;
  
  @Column({ type: 'json', nullable: true, comment: '税务' })
  taxMatters: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '税务-备注' })
  taxRemark: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '税务-服务费' })
  taxServiceFee: number;
  
  @Column({ type: 'json', nullable: true, comment: '银行' })
  bankMatters: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '银行-备注' })
  bankRemark: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '银行-服务费' })
  bankServiceFee: number;
  
  @Column({ type: 'json', nullable: true, comment: '社保' })
  socialSecurity: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '社保-备注' })
  socialSecurityRemark: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '社保-服务费' })
  socialSecurityServiceFee: number;
  
  @Column({ type: 'json', nullable: true, comment: '许可业务' })
  licenseBusiness: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '许可-备注' })
  licenseRemark: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '许可-服务费' })
  licenseServiceFee: number;
  
  @Column({ nullable: true, comment: '其他-备注' })
  otherRemark: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '其他-服务费' })
  otherServiceFee: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '费用总计' })
  totalCost: number;
  
  @Column({ nullable: true, comment: '甲方盖章图片' })
  partyAStampImage: string;
  
  @Column({ type: 'date', nullable: true, comment: '甲方签订日期' })
  partyASignDate: Date;
  
  @Column({ type: 'date', nullable: true, comment: '乙方签订日期' })
  partyBSignDate: Date;
  
  @Column({ type: 'date', nullable: true, comment: '委托开始日期' })
  entrustmentStartDate: Date;
  
  @Column({ type: 'date', nullable: true, comment: '委托结束日期' })
  entrustmentEndDate: Date;
  
  @Column({ type: 'json', nullable: true, comment: '申报服务' })
  declarationService: Array<Record<string, any>>;
  
  @Column({ nullable: true, comment: '其他业务' })
  otherBusiness: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '代理记账总费用' })
  totalAgencyAccountingFee: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '代理记账费' })
  agencyAccountingFee: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '记账软件费' })
  accountingSoftwareFee: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '开票软件费' })
  invoicingSoftwareFee: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '账簿费' })
  accountBookFee: number;
  
  @Column({ nullable: true, comment: '支付方式' })
  paymentMethod: string;
  
  @Column({ nullable: true, comment: '合同状态' })
  contractStatus: string;
  
  @Column({ type: 'boolean', nullable: true, comment: '是否签署' })
  isSigned: boolean;
  
  @CreateDateColumn({ nullable: true, comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ nullable: true, comment: '更新时间' })
  updateTime: Date;

  @Column({ nullable: true, comment: '提交人' })
  submitter: string;

  @Column({ type: 'text', nullable: true, comment: '备注信息' })
  remarks: string;
}
