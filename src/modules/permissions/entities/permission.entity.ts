import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'sys_permission' })
@Unique(['role', 'permission_name']) // 确保每个角色的权限名称唯一
export class Permission {
  @ApiProperty({ description: '权限ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ApiProperty({ description: '角色名称' })
  @Column({ length: 50, comment: '角色名称' })
  role_name: string;

  @ApiProperty({ description: '页面名称' })
  @Column({ length: 50, comment: '页面名称' })
  page_name: string;

  @ApiProperty({ description: '权限名称' })
  @Column({ length: 100, comment: '权限名称' })
  permission_name: string;

  @ApiProperty({ description: '权限值' })
  @Column({
    type: 'boolean', // 明确指定类型
    transformer: {
      // 自定义转换器
      to: (value: boolean) => (value ? 1 : 0),
      from: (value: number) => Boolean(value),
    },
    default: false,
    comment: '是否拥有该权限',
  })
  permission_value: boolean;

  @ApiProperty({ description: '权限描述' })
  @Column({ length: 200, comment: '权限描述' })
  description: string;

  // 自动填充角色名称，模拟Django的save方法重写
  @BeforeInsert()
  @BeforeUpdate()
  updateRoleName() {
    if (this.role && this.role.name && !this.role_name) {
      this.role_name = this.role.name;
    }
  }
}
