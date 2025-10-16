import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_salary')
export class Salary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '部门', type: 'varchar', length: 100 })
  department: string;

  @Column({ comment: '姓名', type: 'varchar', length: 50 })
  name: string;

  @Column({ comment: '身份证号', type: 'varchar', length: 18 })
  idCard: string;

  @Column({ comment: '类型', type: 'varchar', length: 50 })
  type: string;

  @Column({
    comment: '工资基数',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  baseSalary: number;

  @Column({
    comment: '底薪临时增加金额',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  temporaryIncrease: number;

  @Column({
    comment: '临时增加项目',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  temporaryIncreaseItem: string;

  @Column({
    comment: '考勤扣款',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  attendanceDeduction: number;

  @Column({
    comment: '应发基本工资',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  basicSalaryPayable: number;

  @Column({
    comment: '全勤',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  fullAttendance: number;

  @Column({
    comment: '部门负责人补贴',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  departmentHeadSubsidy: number;

  @Column({
    comment: '岗位津贴',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  positionAllowance: number;

  @Column({
    comment: '油补',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  oilSubsidy: number;

  @Column({
    comment: '餐补',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mealSubsidy: number;

  @Column({
    comment: '工龄',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  seniority: number;

  @Column({
    comment: '代理费提成',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  agencyFeeCommission: number;

  @Column({
    comment: '绩效提成',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  performanceCommission: number;

  @Column({ comment: '绩效扣除', type: 'simple-json', nullable: true })
  performanceDeductions: number[];

  @Column({
    comment: '业务提成',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  businessCommission: number;

  @Column({
    comment: '其他扣款',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  otherDeductions: number;

  @Column({
    comment: '个人医疗',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personalMedical: number;

  @Column({
    comment: '个人养老',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personalPension: number;

  @Column({
    comment: '个人失业',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personalUnemployment: number;

  @Column({
    comment: '社保个人合计',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personalInsuranceTotal: number;

  @Column({
    comment: '公司承担合计',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  companyInsuranceTotal: number;

  @Column({
    comment: '保证金扣除',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  depositDeduction: number;

  @Column({
    comment: '个税',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personalIncomeTax: number;

  @Column({
    comment: '其他',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  other: number;

  @Column({
    comment: '应发合计',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalPayable: number;

  @Column({ comment: '银行卡号', type: 'varchar', length: 50 })
  bankCardNumber: string;

  // 注意：company字段已从数据库中删除，改用员工表中的payrollCompany字段
  // @Column({ comment: '对应公司', type: 'varchar', length: 100 })
  // company: string;

  @Column({
    comment: '银行卡/微信',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  bankCardOrWechat: number;

  @Column({
    comment: '对公',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  corporatePayment: number;

  @Column({
    comment: '个税申报',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxDeclaration: number;

  @ApiProperty({ description: '是否已发放', type: 'boolean', default: false })
  @Column({ comment: '是否已发放', type: 'boolean', default: false })
  isPaid: boolean;

  @ApiProperty({ description: '是否已确认', type: 'boolean', default: false })
  @Column({ comment: '是否已确认', type: 'boolean', default: false })
  isConfirmed: boolean;

  @ApiProperty({ description: '确认时间', required: false })
  @Column({ comment: '确认时间', type: 'datetime', nullable: true })
  confirmedAt: Date;

  @Column({ comment: '年月', type: 'date' })
  yearMonth: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
