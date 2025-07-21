import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// 社保信息表
@Entity('sys_social_insurance')
export class SocialInsurance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '姓名', type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({ comment: '个人医疗', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  personalMedical: number;

  @Column({ comment: '个人养老', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  personalPension: number;

  @Column({ comment: '个人失业', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  personalUnemployment: number;

  @Column({ comment: '社保个人合计', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  personalTotal: number;

  @Column({ comment: '公司医疗', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  companyMedical: number;

  @Column({ comment: '公司养老', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  companyPension: number;

  @Column({ comment: '公司失业', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  companyUnemployment: number;

  @Column({ comment: '公司工伤', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  companyInjury: number;

  @Column({ comment: '公司承担合计', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  companyTotal: number;

  @Column({ comment: '总合计', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  grandTotal: number;

  @Column({ comment: '年月', type: 'date', nullable: true })
  yearMonth: Date;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 