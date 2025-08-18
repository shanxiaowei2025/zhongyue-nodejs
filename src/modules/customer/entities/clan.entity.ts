import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_clan')
export class Clan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '宗族名称', unique: true })
  clanName: string;

  @Column({ 
    type: 'json', 
    nullable: true, 
    comment: '成员列表',
    default: () => "'[]'"
  })
  memberList: string[];

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 