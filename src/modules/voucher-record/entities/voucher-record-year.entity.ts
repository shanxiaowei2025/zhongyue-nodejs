import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../customer/entities/customer.entity';
import { VoucherRecordMonth } from './voucher-record-month.entity';

@Entity('voucher_record_years')
@Unique('uk_customer_year', ['customerId', 'year'])
export class VoucherRecordYear {
  @ApiProperty({ description: '主键ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '客户ID', example: 1 })
  @Column({ name: 'customer_id', comment: '客户ID，关联sys_customer表' })
  customerId: number;

  @ApiProperty({ description: '年度', example: 2024 })
  @Column({ comment: '年度（如：2024）' })
  year: number;

  @ApiProperty({ description: '存放位置', example: '办公室档案柜A-001', required: false })
  @Column({ name: 'storage_location', nullable: true, comment: '存放位置' })
  storageLocation: string;

  @ApiProperty({ description: '经手人/负责人员', example: '张三', required: false })
  @Column({ nullable: true, comment: '经手人/负责人员' })
  handler: string;

  @ApiProperty({ description: '取走记录/借出情况', required: false })
  @Column({ name: 'withdrawal_record', type: 'text', nullable: true, comment: '取走记录/借出情况' })
  withdrawalRecord: string;

  @ApiProperty({ description: '通用备注', required: false })
  @Column({ name: 'general_remarks', type: 'text', nullable: true, comment: '通用备注' })
  generalRemarks: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联客户
  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  // 关联月度记录
  @OneToMany(() => VoucherRecordMonth, month => month.yearRecord, { cascade: true })
  months: VoucherRecordMonth[];
} 