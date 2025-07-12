import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('change_history')
export class ChangeHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '企业ID' })
  enterpriseId: number;

  @Column({ comment: '变更类型', length: 100 })
  changeType: string;

  @Column({ comment: '变更前内容', type: 'text', nullable: true })
  contentBefore: string;

  @Column({ comment: '变更后内容', type: 'text', nullable: true })
  contentAfter: string;

  @Column({ comment: '变更日期' })
  changeDate: Date;

  @Column({ comment: '变更人员', length: 100, nullable: true })
  changer: string;

  @Column({ comment: '变更原因', type: 'text', nullable: true })
  changeReason: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
