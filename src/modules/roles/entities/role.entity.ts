import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity({ name: 'sys_role' })
export class Role {
  @ApiProperty({ description: '角色ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '角色名称' })
  @Column({ length: 50, unique: true, comment: '角色名称' })
  name: string;

  @ApiProperty({ description: '角色代码' })
  @Column({ length: 50, unique: true, comment: '角色代码' })
  code: string;

  @ApiProperty({ description: '状态', enum: [0, 1] })
  @Column({ 
    type: 'int',
    default: 1,
    comment: '状态：0-禁用，1-启用' 
  })
  status: number;

  @ApiProperty({ description: '备注' })
  @Column({ length: 500, default: '', comment: '角色备注信息' })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  create_time: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  update_time: Date;

  // 角色与权限的一对多关系
  @OneToMany(() => Permission, permission => permission.role, {
    cascade: true, // 级联操作，创建/更新角色时自动处理权限
  })
  permissions: Permission[];
} 