// 用户实体类，定义用户表的结构
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { ApiProperty, ApiHideProperty } from '../../../common/swagger';

@Entity({ name: 'sys_user' }) // 数据库表名为 sys_user
export class User {
  @ApiProperty({ description: '用户ID', example: 1 })
  // 主键，自动生成
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名', example: '管理员' })
  // 用户名，必须唯一
  @Column({ length: 50, unique: true, comment: '用户名(支持中文)' })
  username: string;

  @ApiHideProperty()
  // 密码，响应时会自动隐藏
  @Column({ length: 100, comment: '密码' })
  @Exclude() // 在响应中排除密码
  password: string;

  @ApiProperty({ description: '是否启用', example: true })
  // 是否启用，默认启用
  @Column({ default: true, comment: '是否启用' })
  isActive: boolean;

  @ApiProperty({ description: '手机号码', example: '13800138000', required: false })
  // 手机号码，可以为空
  @Column({ nullable: true, length: 100, comment: '手机号码' })
  phone: string;
  
  @ApiProperty({ description: '邮箱', example: 'admin@example.com', required: false })
  // 邮箱，可以为空
  @Column({ nullable: true, length: 100, comment: '邮箱' })
  email: string;

  @ApiProperty({ 
    description: '角色列表', 
    example: ['admin', 'user'],
    type: 'array',
    items: {
      type: 'string'
    }
  })
  // 角色列表，JSON数组格式
  @Column({ 
    type: 'json', 
    nullable: true, 
    comment: '角色列表，JSON数组格式' 
  })
  roles: string[];

  @ApiProperty({ description: '创建时间' })
  // 创建时间，自动生成
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  // 更新时间，自动生成
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 在插入数据之前，对密码进行哈希处理
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // 在插入数据之前，设置默认角色
  @BeforeInsert()
  setDefaultRoles() {
    if (!this.roles || this.roles.length === 0) {
      this.roles = ['user'];
    }
  }

  // 验证密码
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
