import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
// 朋友圈补贴表
@Entity('sys_friend_circle_payment')
export class FriendCirclePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '姓名', type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({ comment: '第一周', type: 'int', default: 0, nullable: true })
  weekOne: number;

  @Column({ comment: '第二周', type: 'int', default: 0, nullable: true })
  weekTwo: number;

  @Column({ comment: '第三周', type: 'int', default: 0, nullable: true })
  weekThree: number;

  @Column({ comment: '第四周', type: 'int', default: 0, nullable: true })
  weekFour: number;

  @Column({ comment: '总数', type: 'int', default: 0, nullable: true })
  totalCount: number;

  @Column({ comment: '扣款', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  payment: number;

  @Column({ comment: '是否完成', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ comment: '年月', type: 'date', nullable: true })
  yearMonth: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 