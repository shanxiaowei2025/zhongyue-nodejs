import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_employees')
export class Employee {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '员工ID' })
  id: number;

  @Column({ length: 100, comment: '姓名' })
  @ApiProperty({ description: '姓名' })
  name: string;

  @Column({ nullable: true, comment: '部门id' })
  @ApiProperty({ description: '部门ID', required: false })
  departmentId: number;

  // roles 字段已删除

  @Column({ length: 50, nullable: true, comment: '员工类型' })
  @ApiProperty({ description: '员工类型', required: false })
  employeeType: string;

  @Column({ length: 50, nullable: true, comment: '提成比率职位' })
  @ApiProperty({ description: '提成比率职位', required: false })
  commissionRatePosition: string;

  @Column({ length: 50, nullable: true, comment: '职位' })
  @ApiProperty({ description: '职位', required: false })
  position: string;

  @Column({ length: 50, nullable: true, comment: '职级' })
  @ApiProperty({ description: '职级', required: false })
  rank: string;

  @Column({ type: 'boolean', default: false, comment: '是否离职' })
  @ApiProperty({ description: '是否离职', default: false })
  isResigned: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '工资基数' })
  @ApiProperty({ description: '工资基数', required: false })
  baseSalary: number;

  @Column({ type: 'simple-json', nullable: true, comment: '简历内容' })
  @ApiProperty({ description: '简历文件信息', required: false })
  resume: any;

  @Column({ type: 'date', nullable: true, comment: '生日' })
  @ApiProperty({ description: '生日', required: false })
  birthday: Date;

  @Column({ length: 20, nullable: true, comment: '实际生日' })
  @ApiProperty({ description: '实际生日', required: false })
  actualBirthday: string;

  @Column({ length: 18, nullable: true, comment: '身份证号', unique: true })
  @ApiProperty({ description: '身份证号', required: false })
  idCardNumber: string;

  @Column({ length: 30, nullable: true, comment: '银行卡号' })
  @ApiProperty({ description: '银行卡号', required: false })
  bankCardNumber: string;

  @Column({ length: 50, nullable: true, comment: '开户银行' })
  @ApiProperty({ description: '开户银行', required: false })
  bankName: string;

  @Column({ length: 100, nullable: true, comment: '发工资公司' })
  @ApiProperty({ description: '发工资公司', required: false })
  payrollCompany: string;

  @Column({ type: 'date', nullable: true, comment: '入职时间' })
  @ApiProperty({ description: '入职时间', required: false })
  hireDate: Date;

  @Column({ type: 'int', nullable: true, comment: '公司工龄' })
  @ApiProperty({ description: '公司工龄', required: false })
  workYears: number;

  @CreateDateColumn({ comment: '创建时间' })
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
} 