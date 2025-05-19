import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_expense')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '企业名称' })
  companyName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '企业类型' })
  companyType: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '企业归属地' })
  companyLocation: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '办照类型' })
  licenseType: string;

  @Column({ type: 'int', nullable: true, comment: '办照费用' })
  licenseFee: number;

  // @Column({ type: 'int', nullable: true, comment: '一次性地址费' })
  // oneTimeAddressFee: number;

  @Column({ type: 'int', nullable: true, comment: '牌子费' })
  brandFee: number;

  // @Column({ type: 'int', nullable: true, comment: '刻章费' })
  // sealFee: number;
  
  @Column({ type: 'int', nullable: true, comment: '备案章费用' })
  recordSealFee: number;
  
  @Column({ type: 'int', nullable: true, comment: '一般刻章费用' })
  generalSealFee: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '代理类型' })
  agencyType: string;

  @Column({ type: 'int', nullable: true, comment: '代理费' })
  agencyFee: number;

  @Column({ type: 'int', nullable: true, comment: '记账软件费' })
  accountingSoftwareFee: number;

  @Column({ type: 'date', nullable: true, comment: '记账软件开始日期' })
  accountingSoftwareStartDate: string;

  @Column({ type: 'date', nullable: true, comment: '记账软件结束日期' })
  accountingSoftwareEndDate: string;

  @Column({ type: 'int', nullable: true, comment: '地址费' })
  addressFee: number;

  @Column({ type: 'date', nullable: true, comment: '地址费开始日期' })
  addressStartDate: string;

  @Column({ type: 'date', nullable: true, comment: '地址费结束日期' })
  addressEndDate: string;

  @Column({ type: 'date', nullable: true, comment: '代理开始日期' })
  agencyStartDate: string;

  @Column({ type: 'date', nullable: true, comment: '代理结束日期' })
  agencyEndDate: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '业务类型' })
  businessType: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '合同类型' })
  contractType: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '合同图片' })
  contractImage: string;

  // @Column({ type: 'varchar', length: 255, nullable: true, comment: '开票软件服务商' })
  // invoiceSoftwareProvider: string;

  @Column({ type: 'int', nullable: true, comment: '开票软件费' })
  invoiceSoftwareFee: number;

  @Column({ type: 'date', nullable: true, comment: '开票软件开始日期' })
  invoiceSoftwareStartDate: string;

  @Column({ type: 'date', nullable: true, comment: '开票软件结束日期' })
  invoiceSoftwareEndDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '参保险种' })
  insuranceTypes: string;

  @Column({ type: 'int', nullable: true, comment: '参保人数' })
  insuredCount: number;

  @Column({ type: 'int', nullable: true, comment: '社保代理费' })
  socialInsuranceAgencyFee: number;

  @Column({ type: 'date', nullable: true, comment: '社保开始日期' })
  socialInsuranceStartDate: string;

  @Column({ type: 'date', nullable: true, comment: '社保结束日期' })
  socialInsuranceEndDate: string;

  @Column({ type: 'int', nullable: true, comment: '统计局报表费' })
  statisticalReportFee: number;

  @Column({ type: 'date', nullable: true, comment: '统计开始日期' })
  statisticalStartDate: string;

  @Column({ type: 'date', nullable: true, comment: '统计结束日期' })
  statisticalEndDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '变更业务' })
  changeBusiness: string;

  @Column({ type: 'int', nullable: true, comment: '变更收费' })
  changeFee: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '行政许可' })
  administrativeLicense: string;

  @Column({ type: 'int', nullable: true, comment: '行政许可收费' })
  administrativeLicenseFee: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '其他业务' })
  otherBusiness: string;

  @Column({ type: 'int', nullable: true, comment: '其他业务收费' })
  otherBusinessFee: number;

  @Column({ type: 'simple-json', nullable: true, comment: '收费凭证' })
  proofOfCharge: string[];

  @Column({ type: 'int', nullable: true, comment: '总费用' })
  totalFee: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '业务员' })
  salesperson: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @Column({ type: 'date', nullable: true, comment: '收费日期' })
  chargeDate: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '收费方式' })
  chargeMethod: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '审核员' })
  auditor: string;

  @Column({ type: 'date', nullable: true, comment: '审核日期' })
  auditDate: Date;

  @Column({ type: 'int', default: 0, comment: '状态：0-未审核，1-已审核，2-已退回' })
  status: number;

  @Column({ type: 'text', nullable: true, comment: '审核退回原因' })
  rejectReason: string;

  @Column({ type: 'text', nullable: true, comment: '收据备注' })
  receiptRemarks: string;
  
  @Column({ type: 'text', nullable: true, comment: '内部备注' })
  internalRemarks: string;
} 