import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_tax_verification')
export class TaxVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '企业名称', length: 255, nullable: true })
  companyName: string;

  @Column({ comment: '统一社会信用代码', length: 50, nullable: true })
  unifiedSocialCreditCode: string;

  @Column({ comment: '所属分局', length: 100, nullable: true })
  taxBureau: string;

  @Column({ comment: '风险下发日期', type: 'date', nullable: true })
  riskIssuedDate: Date;

  @Column({ comment: '触发风险原因', type: 'text', nullable: true })
  riskReason: string;

  @Column({ comment: '风险发生日期', type: 'date', nullable: true })
  riskOccurredDate: Date;

  @Column({ comment: '风险期责任会计', length: 100, nullable: true })
  responsibleAccountant: string;

  @Column({ comment: '解决方法', type: 'text', nullable: true })
  solution: string;

  @Column({
    comment: '说明(附件信息)',
    type: 'simple-json',
    nullable: true,
  })
  attachments: any;
}
