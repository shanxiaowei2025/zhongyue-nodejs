// 用户实体类，定义用户表的结构
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Department } from '../../department/entities/department.entity';
import { Role } from '../../roles/entities/role.entity';

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

  @ApiProperty({ description: '密码最后更新时间' })
  // 密码最后更新时间，默认为创建时间
  @Column({ type: 'datetime', comment: '密码最后更新时间', default: () => 'CURRENT_TIMESTAMP' })
  passwordUpdatedAt: Date;

  @ApiProperty({ description: '是否启用', example: true })
  // 是否启用，默认启用
  @Column({ default: true, comment: '是否启用' })
  isActive: boolean;

  @ApiProperty({ description: '手机号码', example: '13800138000', required: false })
  // 手机号码，可以为空
  @Column({ nullable: true, length: 100, comment: '手机号码' })
  phone: string;
  
  @ApiProperty({ description: '头像', example: '/uploads/avatar/default.png', required: false })
  // 头像URL，可以为空
  @Column({ nullable: true, length: 255, comment: '头像URL' })
  avatar: string;
  
  @ApiProperty({ description: '身份证号', example: '110101199001011234', required: false })
  // 身份证号，可以为空，设为唯一
  @Column({ nullable: true, length: 18, comment: '身份证号', unique: true })
  idCardNumber: string;

  @ApiProperty({ 
    description: '角色列表', 
    example: ['admin', 'user'],
    type: 'array',
    items: { type: 'string' }
  })
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '用户角色列表，JSON格式'
  })
  roles: string[];

  @ApiProperty({ description: '部门ID', required: true, example: 1 })
  @Column({ comment: '用户所属部门ID' })
  dept_id: number;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'dept_id' })
  department: Department;
  
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
    // 确保roles是有效的数组
    if (!this.roles || !Array.isArray(this.roles) || this.roles.length === 0) {
      this.roles = ['user'];
    }
  }

  // 在插入数据之前，设置密码更新时间
  @BeforeInsert()
  setPasswordUpdatedAt() {
    // 创建时，密码更新时间就是当前时间
    this.passwordUpdatedAt = new Date();
  }

  // 验证密码
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // 检查用户是否拥有指定角色
  hasRole(roleName: string): boolean {
    return this.roles && this.roles.includes(roleName);
  }
}
