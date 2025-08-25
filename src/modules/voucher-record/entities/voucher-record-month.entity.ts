import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { VoucherRecordYear } from './voucher-record-year.entity';

@Entity('voucher_record_months')
@Unique('uk_year_month', ['yearRecordId', 'month'])
export class VoucherRecordMonth {
  @ApiProperty({ description: '主键ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '年度记录ID', example: 1 })
  @Column({ name: 'year_record_id', comment: '年度记录ID，关联voucher_record_years表' })
  yearRecordId: number;

  @ApiProperty({ description: '月份（1-12）', example: 1, minimum: 1, maximum: 12 })
  @Column({ type: 'tinyint', comment: '月份（1-12）' })
  month: number;

  @ApiProperty({ 
    description: '状态（由前端定义具体内容）', 
    example: '已完成',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '状态（由前端定义具体内容）',
  })
  status: string;

  @ApiProperty({ description: '月度说明/备注', required: false })
  @Column({ type: 'text', nullable: true, comment: '月度说明/备注' })
  description: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联年度记录
  @ManyToOne(() => VoucherRecordYear, year => year.months, { nullable: false })
  @JoinColumn({ name: 'year_record_id' })
  yearRecord: VoucherRecordYear;
} 