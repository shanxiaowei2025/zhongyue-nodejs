import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_financial_self_inspection')
export class FinancialSelfInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    default: 0,
    comment:
      '状态(0：已提交未整改 1：已整改 2：抽查人确认 3：抽查人退回 4：复查人(管理员)确认 5：复查人(管理员)退回)',
  })
  status: number;

  @Column({ type: 'date', nullable: true, comment: '抽查日期' })
  inspectionDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '企业名称' })
  companyName: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '统一社会信用代码',
  })
  unifiedSocialCreditCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '记账会计' })
  bookkeepingAccountant: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '顾问会计' })
  consultantAccountant: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '抽查人' })
  inspector: string;

  @Column({ type: 'text', nullable: true, comment: '问题' })
  problem: string;

  @Column({ type: 'text', nullable: true, comment: '解决方案' })
  solution: string;

  @Column({ type: 'simple-json', nullable: true, comment: '整改记录' })
  rectificationRecords: Record<string, any>[];

  @Column({ type: 'simple-json', nullable: true, comment: '审核通过记录' })
  approvalRecords: Record<string, any>[];

  @Column({ type: 'simple-json', nullable: true, comment: '审核退回记录' })
  rejectRecords: Record<string, any>[];

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '复查人' })
  reviewer: string;

  @Column({ type: 'simple-json', nullable: true, comment: '复查审核通过记录' })
  reviewerApprovalRecords: Record<string, any>[];

  @Column({ type: 'simple-json', nullable: true, comment: '复查审核退回记录' })
  reviewerRejectRecords: Record<string, any>[];

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
