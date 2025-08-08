import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// 考勤扣款表
@Entity('sys_attendance_deduction')
export class AttendanceDeduction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '姓名', type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({
    comment: '考勤扣款',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  attendanceDeduction: number;

  @Column({
    comment: '全勤奖励',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  fullAttendanceBonus: number;

  @Column({ comment: '年月', type: 'date', nullable: true })
  yearMonth: Date;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
