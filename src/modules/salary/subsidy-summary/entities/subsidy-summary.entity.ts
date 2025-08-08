import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// 补贴合计表
@Entity('sys_subsidy_summary')
export class SubsidySummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '姓名', type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({ comment: '部门', type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ comment: '职位', type: 'varchar', length: 100, nullable: true })
  position: string;

  @Column({
    comment: '部门负责人补贴',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  departmentHeadSubsidy: number;

  @Column({
    comment: '岗位津贴',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  positionAllowance: number;

  @Column({
    comment: '油补',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  oilSubsidy: number;

  @Column({
    comment: '餐补8元/天',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  mealSubsidy: number;

  @Column({
    comment: '补贴合计',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  totalSubsidy: number;

  @Column({ comment: '年月', type: 'date', nullable: true })
  yearMonth: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
