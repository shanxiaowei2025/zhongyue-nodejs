import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_service_history')
export class ServiceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '企业名称', length: 100 })
  companyName: string;

  @Column({ comment: '统一社会信用代码', length: 100 })
  unifiedSocialCreditCode: string;

  @Column({ comment: '顾问会计', length: 100, nullable: true })
  consultantAccountant: string;

  @Column({ comment: '记账会计', length: 100, nullable: true })
  bookkeepingAccountant: string;

  @Column({ comment: '开票员', length: 100, nullable: true })
  invoiceOfficer: string;

  @Column({ comment: '企业状态', length: 50, default: 'normal' })
  enterpriseStatus: string;

  @Column({ comment: '工商状态', length: 50, nullable: true })
  businessStatus: string;

  @Column({ comment: '创建时间', nullable: true })
  createdAt: Date;

  @Column({ comment: '更新时间', nullable: true })
  updatedAt: Date;
}
