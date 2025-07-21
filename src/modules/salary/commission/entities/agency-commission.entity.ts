import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_agency_commission')
export class AgencyCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '代理户数', type: 'varchar', length: 50 })
  agencyCount: string;

  @Column({ comment: '最低提成基数(元)', type: 'decimal', precision: 10, scale: 2 })
  minCommissionBase: number;

  @Column({ comment: '收费额', type: 'varchar', length: 50 })
  feeRange: string;

  @Column({ comment: '提成比率', type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 