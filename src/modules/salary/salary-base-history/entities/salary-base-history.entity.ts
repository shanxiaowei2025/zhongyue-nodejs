import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('sys_salary_base_history')
export class SalaryBaseHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '员工姓名', type: 'varchar', length: 50 })
  employeeName: string;

  @Column({
    comment: '调整前底薪',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  beforeBaseSalary: number;

  @Column({
    comment: '调整后底薪',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  afterBaseSalary: number;

  @Column({ comment: '修改人', type: 'varchar', length: 50 })
  modifiedBy: string;

  @CreateDateColumn({ comment: '修改时间' })
  modifiedAt: Date;
}
