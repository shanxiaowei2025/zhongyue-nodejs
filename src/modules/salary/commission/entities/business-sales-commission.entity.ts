import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_business_sales_commission')
export class BusinessSalesCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '类型', type: 'varchar', length: 50 })
  type: string;

  @Column({ comment: '底薪', type: 'decimal', precision: 10, scale: 2 })
  baseSalary: number;

  @Column({ comment: '收费额', type: 'varchar', length: 50 })
  feeRange: string;

  @Column({ comment: '提成比率', type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 