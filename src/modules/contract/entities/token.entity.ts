import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Contract } from './contract.entity';

@Entity('sys_token')
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, comment: '令牌值', unique: true })
  token: string;

  @Column({ nullable: false, comment: '关联的合同ID' })
  contractId: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '过期时间' })
  expiredAt: Date;
}
