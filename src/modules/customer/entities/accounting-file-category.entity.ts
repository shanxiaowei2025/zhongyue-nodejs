import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('accounting_file_category')
export class AccountingFileCategory {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '分类ID' })
  id: number;

  @Column({ comment: '客户ID' })
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @Column({ comment: '分类名称' })
  @ApiProperty({ description: '分类名称，如"2024年财务"' })
  categoryName: string;

  @Column({ comment: '分类路径' })
  @ApiProperty({ description: '系统生成的分类路径，如"财务报表/2024年财务"' })
  categoryPath: string;

  @Column({ nullable: true, comment: '父分类ID' })
  @ApiProperty({ description: '父分类ID，用于支持多级目录' })
  parentId: number | null;

  @CreateDateColumn({ comment: '创建时间' })
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
