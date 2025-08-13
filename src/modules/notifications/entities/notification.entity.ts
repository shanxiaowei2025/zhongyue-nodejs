import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_notification')
export class Notification {
  @ApiProperty({ description: '通知ID' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ description: '通知标题' })
  @Column({ type: 'varchar', length: 255, comment: '通知标题' })
  title: string;

  @ApiProperty({ description: '通知内容' })
  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @ApiProperty({ description: '通知类型（自由字符串）' })
  @Column({ type: 'varchar', length: 50, default: 'system', comment: '通知类型（自由字符串）' })
  type: string;

  @ApiProperty({ description: '创建者用户ID' })
  @Index()
  @Column({ type: 'int', comment: '创建者用户ID' })
  createdBy: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;
} 