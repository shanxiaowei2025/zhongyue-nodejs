import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 业务选项实体类
 * 用于存储各类业务的可选项，支持默认选项和自定义选项
 */
@Entity('business_options')
export class BusinessOption {
  @ApiProperty({ description: '主键ID', example: 1 })
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @ApiProperty({ 
    description: '业务类别', 
    example: 'change_business',
    enum: [
      'change_business',
      'administrative_license', 
      'other_business_basic',
      'other_business_outsourcing',
      'other_business_special'
    ]
  })
  @Column({ 
    type: 'varchar', 
    length: 100, 
    comment: '业务类别（如：change_business, administrative_license 等）' 
  })
  category: string;

  @ApiProperty({ description: '选项值', example: '地址变更' })
  @Column({ 
    type: 'varchar', 
    length: 200, 
    name: 'option_value',
    comment: '选项值' 
  })
  optionValue: string;

  @ApiProperty({ description: '是否为默认选项', example: true })
  @Column({ 
    type: 'tinyint', 
    default: 0,
    name: 'is_default',
    comment: '是否为默认选项（0-否，1-是）' 
  })
  isDefault: boolean;

  @ApiProperty({ description: '创建人', example: 'admin', required: false })
  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true,
    name: 'created_by',
    comment: '创建人' 
  })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ 
    type: 'timestamp',
    name: 'created_at',
    comment: '创建时间' 
  })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ 
    type: 'timestamp',
    name: 'updated_at',
    comment: '更新时间' 
  })
  updatedAt: Date;
}

