import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 群组实体类
 * 对应数据库表: groups
 */
@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('increment', { comment: '群组ID' })
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    unique: true, 
    comment: '聊天ID' 
  })
  @Index('idx_groups_chatId')
  chatId: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    comment: '群组名称' 
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    comment: '群组所有者' 
  })
  @Index('idx_groups_owner')
  owner: string;

  @Column({ 
    type: 'json', 
    comment: '成员列表' 
  })
  members: any;

  @Column({ 
    type: 'json', 
    nullable: true, 
    comment: '最后一条消息' 
  })
  lastMessage?: any;

  @Column({ 
    type: 'json', 
    nullable: true, 
    comment: '最后一条员工消息' 
  })
  lastEmployeeMessage?: any;

  @Column({ 
    type: 'json', 
    nullable: true, 
    comment: '最后一条客户消息' 
  })
  lastCustomerMessage?: any;

  @Column({ 
    type: 'tinyint', 
    width: 1, 
    default: 0, 
    comment: '是否需要提醒' 
  })
  @Index('idx_groups_needAlert')
  needAlert: boolean;

  @Column({ 
    type: 'int', 
    default: 0, 
    comment: '提醒级别' 
  })
  alertLevel: number;

  @CreateDateColumn({ 
    type: 'datetime', 
    comment: '创建时间' 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: 'datetime', 
    comment: '更新时间' 
  })
  updatedAt: Date;
} 