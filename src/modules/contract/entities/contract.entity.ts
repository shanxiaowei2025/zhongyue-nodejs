import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BusinessType, ContractStatus } from '../dto/create-contract.dto';

@Entity('sys_contract')
export class Contract {
  @ApiProperty({ description: '合同ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '合同编号' })
  @Column({ length: 50, unique: true, comment: '合同编号' })
  contract_no: string;

  @ApiProperty({ description: '业务类型' })
  @Column({ 
    type: 'enum',
    enum: BusinessType,
    comment: '业务类型'
  })
  business_type: BusinessType;

  @ApiProperty({ description: '客户名称' })
  @Index()
  @Column({ length: 255, comment: '客户名称' })
  customer_name: string;

  @ApiProperty({ description: '客户统一社会信用代码' })
  @Column({ length: 50, comment: '客户统一社会信用代码' })
  customer_code: string;

  @ApiProperty({ description: '客户地址' })
  @Column({ length: 255, comment: '客户地址' })
  customer_address: string;

  @ApiProperty({ description: '客户电话' })
  @Column({ length: 20, comment: '客户电话' })
  customer_phone: string;

  @ApiProperty({ description: '客户联系人' })
  @Column({ length: 50, comment: '客户联系人' })
  customer_contact: string;

  @ApiProperty({ description: '公司名称' })
  @Column({ length: 255, comment: '公司名称' })
  company_name: string;

  @ApiProperty({ description: '公司统一社会信用代码' })
  @Column({ length: 50, comment: '公司统一社会信用代码' })
  company_code: string;

  @ApiProperty({ description: '公司地址' })
  @Column({ length: 255, comment: '公司地址' })
  company_address: string;

  @ApiProperty({ description: '公司电话' })
  @Column({ length: 20, comment: '公司电话' })
  company_phone: string;

  @ApiProperty({ description: '业务人员' })
  @Column({ length: 50, comment: '业务人员' })
  business_person: string;

  @ApiProperty({ description: '合同金额' })
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '合同金额' })
  amount: number;

  @ApiProperty({ description: '签订日期' })
  @Column({ type: 'date', comment: '签订日期' })
  sign_date: string;

  @ApiProperty({ description: '开始日期' })
  @Column({ type: 'date', comment: '开始日期' })
  start_date: string;

  @ApiProperty({ description: '到期日期' })
  @Column({ type: 'date', comment: '到期日期' })
  expire_date: string;

  @ApiProperty({ description: '合同状态' })
  @Index()
  @Column({ 
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.UNSIGNED,
    comment: '合同状态' 
  })
  status: ContractStatus;

  @ApiProperty({ description: '备注信息' })
  @Column({ type: 'text', nullable: true, comment: '备注信息' })
  remark: string;

  @ApiProperty({ description: '合同文件URL列表' })
  @Column({ type: 'simple-array', comment: '合同文件URL列表' })
  contract_files: string[];

  @ApiProperty({ description: '提交人' })
  @Column({ length: 50, comment: '提交人' })
  submitter: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
} 