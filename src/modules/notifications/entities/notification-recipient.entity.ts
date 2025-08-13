import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Notification } from './notification.entity';

@Entity('sys_notification_recipient')
export class NotificationRecipient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ description: '通知ID' })
  @Index()
  @Column({ type: 'int', comment: '通知ID' })
  notificationId: number;

  @ApiProperty({ description: '接收用户ID' })
  @Index()
  @Column({ type: 'int', comment: '接收用户ID' })
  userId: number;

  @ApiProperty({ description: '已读状态' })
  @Column({ type: 'tinyint', default: 0, comment: '已读状态：0未读，1已读' })
  readStatus: number;

  @ApiProperty({ description: '阅读时间', required: false })
  @Column({ type: 'datetime', nullable: true, comment: '阅读时间' })
  readAt: Date | null;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  // 关联关系：多个接收者记录对应一个通知
  @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;
} 