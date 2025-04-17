import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'sys_department' })
export class Department {
  @ApiProperty({ description: '部门ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '部门名称' })
  @Column({ length: 100, comment: '部门名称' })
  name: string;

  @ApiProperty({ description: '父部门ID' })
  @ManyToOne(() => Department, department => department.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: Department;

  @OneToMany(() => Department, department => department.parent)
  children: Department[];

  @ApiProperty({ description: '排序' })
  @Column({ default: 0, comment: '部门排序值' })
  sort: number;

  @ApiProperty({ description: '联系电话' })
  @Column({ length: 20, default: '', comment: '部门联系电话' })
  phone: string;

  @ApiProperty({ description: '负责人' })
  @Column({ length: 100, default: '', comment: '部门负责人' })
  principal: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ length: 100, default: '', comment: '部门联系邮箱' })
  email: string;

  @ApiProperty({ description: '状态', enum: [0, 1] })
  @Column({ default: 1, comment: '部门状态：0-禁用，1-启用' })
  status: number;

  @ApiProperty({ description: '类型', enum: [1, 2, 3] })
  @Column({ default: 3, comment: '部门类型：1-公司，2-分公司，3-部门' })
  type: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ comment: '部门创建时间' })
  create_time: Date;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true, comment: '部门备注信息' })
  remark: string;
}