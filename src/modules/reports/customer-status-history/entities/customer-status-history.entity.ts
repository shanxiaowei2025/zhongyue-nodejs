import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../../customer/entities/customer.entity';

@Entity('customer_status_history')
@Index(['customerId', 'changeDate'])
@Index(['changeDate'])
@Index(['unifiedSocialCreditCode'])
export class CustomerStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '客户ID' })
  customerId: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ comment: '企业名称', length: 200 })
  companyName: string;

  @Column({ comment: '统一社会信用代码', length: 100 })
  unifiedSocialCreditCode: string;

  @Column({ comment: '变更前的企业状态', length: 50, nullable: true })
  previousEnterpriseStatus: string;

  @Column({ comment: '变更后的企业状态', length: 50 })
  currentEnterpriseStatus: string;

  @Column({ comment: '变更前的业务状态', length: 50, nullable: true })
  previousBusinessStatus: string;

  @Column({ comment: '变更后的业务状态', length: 50 })
  currentBusinessStatus: string;

  @Column({ comment: '状态变更日期', type: 'date' })
  changeDate: Date;

  @Column({ comment: '变更原因', type: 'text', nullable: true })
  changeReason: string;

  @Column({ comment: '操作人员', length: 100, nullable: true })
  changedBy: string;

  @Column({ comment: '备注信息', type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({
    comment: '记录创建时间',
    type: 'timestamp',
    precision: 0,
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: '记录更新时间',
    type: 'timestamp',
    precision: 0,
  })
  updatedAt: Date;
} 