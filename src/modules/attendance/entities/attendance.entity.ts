import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_attendance')
export class Attendance {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  // 基础信息
  @Column({ type: 'date', nullable: true, comment: '日报日期' })
  date: Date;

  @Column({
    type: 'tinyint',
    unsigned: true,
    nullable: true,
    comment:
      '记录类型：1-固定上下班；2-外出；3-按班次上下班；4-自由签到；5-加班；7-无规则',
  })
  record_type: number;

  @Column({ length: 50, nullable: true, comment: '打卡人员姓名' })
  name: string;

  @Column({ length: 50, nullable: true, comment: '打卡人员别名' })
  name_ex: string;

  @Column({ length: 255, nullable: true, comment: '打卡人员所在部门' })
  departs_name: string;

  @Column({ length: 64, nullable: true, comment: '打卡人员账号，即userid' })
  acctid: string;

  @Column({ nullable: true, comment: '所属规则的id' })
  groupid: number;

  @Column({ length: 100, nullable: true, comment: '打卡规则名' })
  groupname: string;

  @Column({ nullable: true, comment: '当日所属班次id' })
  scheduleid: number;

  @Column({ length: 100, nullable: true, comment: '当日所属班次名称' })
  schedulename: string;

  @Column({ type: 'time', nullable: true, comment: '上班时间' })
  checkintime_work: Date;

  @Column({ type: 'time', nullable: true, comment: '下班时间' })
  checkintime_off_work: Date;

  @Column({
    type: 'tinyint',
    unsigned: true,
    nullable: true,
    comment: '日报类型：0-工作日日报；1-休息日日报',
  })
  day_type: number;

  // 汇总信息
  @Column({ nullable: true, comment: '当日打卡次数' })
  checkin_count: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '当日实际工作时长，单位：小时',
  })
  regular_work_sec: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '当日标准工作时长，单位：小时',
  })
  standard_work_sec: number;

  @Column({ type: 'time', nullable: true, comment: '当日最早打卡时间' })
  earliest_time: Date;

  @Column({ type: 'time', nullable: true, comment: '当日最晚打卡时间' })
  lastest_time: Date;

  // 异常信息
  @Column({ type: 'tinyint', unsigned: true, default: 0, comment: '迟到次数' })
  exception_late: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0, comment: '早退次数' })
  exception_early: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0, comment: '缺卡次数' })
  exception_absent: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0, comment: '旷工次数' })
  exception_missing: number;

  @Column({
    type: 'tinyint',
    unsigned: true,
    default: 0,
    comment: '地点异常次数',
  })
  exception_location: number;

  @Column({
    type: 'tinyint',
    unsigned: true,
    default: 0,
    comment: '设备异常次数',
  })
  exception_device: number;

  @Column({ default: 0, comment: '迟到时长(分钟)' })
  late_duration: number;

  @Column({ default: 0, comment: '早退时长(分钟)' })
  early_duration: number;

  @Column({ default: 0, comment: '旷工时长(分钟)' })
  missing_duration: number;

  // 加班信息
  @Column({
    type: 'tinyint',
    unsigned: true,
    default: 0,
    comment: '加班状态：0-无加班；1-正常；2-缺时长',
  })
  ot_status: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '加班时长(小时)',
  })
  ot_duration: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '加班不足的时长(小时)',
  })
  exception_duration: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '工作日加班记为调休(小时)',
  })
  workday_over_as_vacation: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '工作日加班记为加班费(小时)',
  })
  workday_over_as_money: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '休息日加班记为调休(小时)',
  })
  restday_over_as_vacation: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '休息日加班记为加班费(小时)',
  })
  restday_over_as_money: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '节假日加班记为调休(小时)',
  })
  holiday_over_as_vacation: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: '节假日加班记为加班费(小时)',
  })
  holiday_over_as_money: number;

  // 假勤相关
  @Column({ length: 64, nullable: true, comment: '假勤申请id' })
  sp_number: string;

  @Column({ length: 255, nullable: true, comment: '假勤信息摘要标题' })
  sp_title: string;

  @Column({ length: 512, nullable: true, comment: '假勤信息摘要描述' })
  sp_description: string;

  // 假勤统计（JSON格式存储多种假勤类型）
  @Column({ type: 'json', nullable: true, comment: '假勤统计信息JSON数据' })
  sp_items: string;

  // 附加字段
  @Column({ type: 'json', nullable: true, comment: '原始数据JSON' })
  raw_data: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}
