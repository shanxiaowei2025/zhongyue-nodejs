import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_performance_commission')
export class PerformanceCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'P级', type: 'varchar', length: 50, nullable: true })
  pLevel: string;

  @Column({ comment: '档级', type: 'varchar', length: 50, nullable: true })
  gradeLevel: string;

  @Column({ comment: '户数', type: 'varchar', length: 50, nullable: true })
  householdCount: string;

  @Column({
    comment: '底薪(元)',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  baseSalary: number;

  @Column({
    comment: '绩效(元)',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  performance: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
