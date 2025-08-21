import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 报表缓存实体
 * 用于缓存报表查询结果，提高系统性能
 */
@Entity('sys_report_cache')
@Index(['reportType', 'cacheKey'], { unique: false })
@Index(['cacheKey', 'userId'], { unique: true })
export class ReportCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: false, 
    comment: '报表类型' 
  })
  @Index()
  reportType: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: false, 
    comment: '缓存键' 
  })
  @Index()
  cacheKey: string;

  @Column({ 
    type: 'json', 
    nullable: true, 
    comment: '缓存数据' 
  })
  cacheData: any;

  @Column({ 
    type: 'int', 
    nullable: true, 
    comment: '用户ID（用户级缓存）' 
  })
  @Index()
  userId: number;

  @Column({ 
    type: 'datetime', 
    nullable: true, 
    comment: '过期时间' 
  })
  @Index()
  expiresAt: Date;

  @CreateDateColumn({
    type: 'datetime',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    comment: '更新时间',
  })
  updatedAt: Date;
} 