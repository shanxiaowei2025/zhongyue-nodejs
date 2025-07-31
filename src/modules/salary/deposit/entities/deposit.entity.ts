import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_deposit')
export class Deposit {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '主键ID' })
  id: number;

  @Column({ comment: '姓名', type: 'varchar', length: 50 })
  @ApiProperty({ description: '姓名' })
  name: string;

  @Column({ comment: '保证金扣除', type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: '保证金扣除金额' })
  amount: number;

  @Column({ comment: '扣除日期', type: 'date' })
  @ApiProperty({ description: '扣除日期' })
  deductionDate: Date;

  @Column({ comment: '备注', type: 'varchar', length: 200, nullable: true })
  @ApiProperty({ description: '备注', required: false })
  remark: string;

  @CreateDateColumn({ comment: '创建时间' })
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
} 