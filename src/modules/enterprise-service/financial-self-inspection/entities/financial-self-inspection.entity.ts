import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_financial_self_inspection')
export class FinancialSelfInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: true, comment: '抽查日期' })
  inspectionDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '企业名称' })
  companyName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '统一社会信用代码' })
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

  @Column({ type: 'date', nullable: true, comment: '整改完成日期' })
  rectificationCompletionDate: Date;

  @Column({ type: 'text', nullable: true, comment: '整改结果' })
  rectificationResult: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '复查人' })
  reviewer: string;

  @Column({ type: 'text', nullable: true, comment: '复查问题' })
  reviewerProblem: string;

  @Column({ type: 'text', nullable: true, comment: '复查解决方案' })
  reviewerSolution: string;

  @Column({ type: 'date', nullable: true, comment: '复查整改完成日期' })
  reviewerRectificationCompletionDate: Date;

  @Column({ type: 'text', nullable: true, comment: '复查整改结果' })
  reviewerRectificationResult: string;

  @Column({ type: 'date', nullable: true, comment: '复查人确认' })
  reviewerConfirmation: Date;

  @Column({ type: 'text', nullable: true, comment: '复查备注' })
  reviewerRemarks: string;

  @Column({ type: 'date', nullable: true, comment: '抽查人确认' })
  inspectorConfirmation: Date;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 