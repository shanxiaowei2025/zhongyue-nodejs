import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import {
  Repository,
  Between,
  Like,
  MoreThanOrEqual,
  LessThanOrEqual,
  Raw,
} from 'typeorm';
import {
  QueryAttendanceDto,
  AttendanceExceptionType,
} from './dto/query-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  /**
   * 创建考勤记录
   * @param createDto 创建参数
   */
  async create(createDto: CreateAttendanceDto): Promise<Attendance> {
    try {
      // 检查该日期和工号是否已存在记录
      const existingRecord = await this.attendanceRepository.findOne({
        where: {
          date: createDto.date,
          acctid: createDto.acctid,
        },
      });

      if (existingRecord) {
        throw new Error('该员工在当天已有考勤记录');
      }

      // 处理时间字符串
      const attendance = new Attendance();
      Object.assign(attendance, createDto);

      // 处理上班时间
      if (createDto.checkintime_work) {
        const [hours, minutes] = createDto.checkintime_work
          .split(':')
          .map(Number);
        const workTime = new Date(0);
        workTime.setUTCHours(hours, minutes, 0);
        attendance.checkintime_work = workTime;
      }

      // 处理下班时间
      if (createDto.checkintime_off_work) {
        const [hours, minutes] = createDto.checkintime_off_work
          .split(':')
          .map(Number);
        const offWorkTime = new Date(0);
        offWorkTime.setUTCHours(hours, minutes, 0);
        attendance.checkintime_off_work = offWorkTime;
      }

      // 保存记录
      return await this.attendanceRepository.save(attendance);
    } catch (error) {
      console.error('创建考勤记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取单条考勤记录
   * @param id 记录ID
   */
  async findOne(id: number): Promise<Attendance> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
      });

      if (!attendance) {
        throw new NotFoundException(`ID为${id}的考勤记录不存在`);
      }

      return attendance;
    } catch (error) {
      console.error(`获取考勤记录(ID: ${id})失败:`, error);
      throw error;
    }
  }

  /**
   * 更新考勤记录
   * @param updateDto 更新参数
   */
  async update(updateDto: UpdateAttendanceDto): Promise<Attendance> {
    try {
      const { id, ...updateData } = updateDto;

      // 检查记录是否存在
      const attendance = await this.findOne(id);

      // 处理时间字符串
      if (
        updateData.checkintime_work &&
        typeof updateData.checkintime_work === 'string'
      ) {
        const [hours, minutes] = updateData.checkintime_work
          .split(':')
          .map(Number);
        const workTime = new Date(0);
        workTime.setUTCHours(hours, minutes, 0);
        // 转换类型
        updateData.checkintime_work = workTime as any;
      }

      if (
        updateData.checkintime_off_work &&
        typeof updateData.checkintime_off_work === 'string'
      ) {
        const [hours, minutes] = updateData.checkintime_off_work
          .split(':')
          .map(Number);
        const offWorkTime = new Date(0);
        offWorkTime.setUTCHours(hours, minutes, 0);
        // 转换类型
        updateData.checkintime_off_work = offWorkTime as any;
      }

      // 更新记录
      Object.assign(attendance, updateData);
      return await this.attendanceRepository.save(attendance);
    } catch (error) {
      console.error(`更新考勤记录失败:`, error);
      throw error;
    }
  }

  /**
   * 删除考勤记录
   * @param id 记录ID
   */
  async remove(id: number): Promise<void> {
    try {
      // 检查记录是否存在
      const attendance = await this.findOne(id);

      // 删除记录
      await this.attendanceRepository.remove(attendance);
    } catch (error) {
      console.error(`删除考勤记录(ID: ${id})失败:`, error);
      throw error;
    }
  }

  /**
   * 查询考勤数据（带分页和模糊查询）
   * @param queryDto 查询参数
   */
  async findAll(
    queryDto: QueryAttendanceDto,
  ): Promise<{ items: Attendance[]; total: number }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        name,
        acctid,
        departs_name,
        startDate,
        endDate,
        hasException,
        exceptionType,
        day_type,
        ot_status,
        sortField = 'date',
        sortOrder = 'DESC',
      } = queryDto;

      // 构建查询条件
      const where: any = {};

      // 姓名模糊查询
      if (name) {
        where.name = Like(`%${name}%`);
      }

      // 工号精确查询
      if (acctid) {
        where.acctid = acctid;
      }

      // 部门名称模糊查询
      if (departs_name) {
        where.departs_name = Like(`%${departs_name}%`);
      }

      // 日期范围查询
      if (startDate && endDate) {
        where.date = Between(startDate, endDate);
      } else if (startDate) {
        where.date = MoreThanOrEqual(startDate);
      } else if (endDate) {
        where.date = LessThanOrEqual(endDate);
      }

      // 日报类型查询
      if (day_type !== undefined) {
        where.day_type = day_type;
      }

      // 加班状态查询
      if (ot_status !== undefined) {
        where.ot_status = ot_status;
      }

      // 异常查询
      if (hasException === 1) {
        if (
          exceptionType !== undefined &&
          exceptionType !== AttendanceExceptionType.ALL
        ) {
          // 根据指定的异常类型查询
          switch (exceptionType) {
            case AttendanceExceptionType.LATE:
              where.exception_late = MoreThanOrEqual(1);
              break;
            case AttendanceExceptionType.EARLY:
              where.exception_early = MoreThanOrEqual(1);
              break;
            case AttendanceExceptionType.ABSENT:
              where.exception_absent = MoreThanOrEqual(1);
              break;
            case AttendanceExceptionType.MISSING:
              where.exception_missing = MoreThanOrEqual(1);
              break;
            case AttendanceExceptionType.LOCATION:
              where.exception_location = MoreThanOrEqual(1);
              break;
            case AttendanceExceptionType.DEVICE:
              where.exception_device = MoreThanOrEqual(1);
              break;
          }
        } else {
          // 查询所有类型的异常
          where.id = Raw(
            (id) =>
              `${id} IN (
              SELECT id FROM sys_attendance 
              WHERE 
                exception_late > 0 OR 
                exception_early > 0 OR 
                exception_absent > 0 OR 
                exception_missing > 0 OR 
                exception_location > 0 OR 
                exception_device > 0
            )`,
          );
        }
      }

      // 计算分页参数
      const skip = (page - 1) * pageSize;

      // 构建排序选项
      const order: any = {};

      // 验证排序字段是否有效，避免SQL注入
      const validSortFields = [
        'date',
        'name',
        'departs_name',
        'checkin_count',
        'regular_work_sec',
        'standard_work_sec',
        'ot_duration',
        'exception_late',
        'exception_early',
        'exception_absent',
        'exception_missing',
      ];

      // 如果是有效的排序字段，则使用请求中的排序字段
      const finalSortField = validSortFields.includes(sortField)
        ? sortField
        : 'date';

      // 验证排序方向
      const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder)
        ? sortOrder
        : 'DESC';

      // 设置排序
      order[finalSortField] = finalSortOrder;

      // 执行查询
      const [items, total] = await this.attendanceRepository.findAndCount({
        where,
        skip,
        take: pageSize,
        order,
      });

      return { items, total };
    } catch (error) {
      console.error('查询考勤数据出错:', error);
      throw error;
    }
  }

  /**
   * 保存考勤数据
   * @param data 考勤数据
   */
  async saveAttendanceData(data: any): Promise<Attendance> {
    try {
      // 基本信息检查
      if (
        !data ||
        !data.base_info ||
        !data.base_info.date ||
        !data.base_info.acctid
      ) {
        console.error('考勤数据缺少必要的基本信息', data);
        return null;
      }

      const baseDate = new Date(data.base_info.date * 1000);
      // 检查该记录是否已存在（通过日期和员工ID确认）
      const existingRecord = await this.attendanceRepository.findOne({
        where: {
          date: baseDate,
          acctid: data.base_info.acctid,
        },
      });

      const transformedData = this.transformAttendanceData(data);

      // 如果已存在，更新记录
      if (existingRecord) {
        return this.attendanceRepository.save({
          ...existingRecord,
          ...transformedData,
        });
      }

      // 否则，创建新记录
      return this.attendanceRepository.save(transformedData);
    } catch (error) {
      console.error('保存考勤数据出错:', error);
      throw error;
    }
  }

  /**
   * 转换企业微信数据为数据库实体
   */
  private transformAttendanceData(data: any): Partial<Attendance> {
    try {
      const baseInfo = data.base_info || {};
      const ruleInfo = baseInfo.rule_info || {};
      const summaryInfo = data.summary_info || {};
      const otInfo = data.ot_info || {};

      // 获取打卡时间并转换为时分秒格式
      let checkintime_work = null;
      let checkintime_off_work = null;

      if (ruleInfo.checkintime && ruleInfo.checkintime.length > 0) {
        if (
          ruleInfo.checkintime[0] &&
          typeof ruleInfo.checkintime[0].work_sec === 'number'
        ) {
          const workSec = ruleInfo.checkintime[0].work_sec;
          const workDate = new Date(0);
          workDate.setUTCHours(
            Math.floor(workSec / 3600),
            Math.floor((workSec % 3600) / 60),
            workSec % 60,
          );
          checkintime_work = workDate;
        }

        // 最后一个时间段作为下班时间
        const lastIndex = ruleInfo.checkintime.length - 1;
        if (
          ruleInfo.checkintime[lastIndex] &&
          typeof ruleInfo.checkintime[lastIndex].off_work_sec === 'number'
        ) {
          const offWorkSec = ruleInfo.checkintime[lastIndex].off_work_sec;
          const offWorkDate = new Date(0);
          offWorkDate.setUTCHours(
            Math.floor(offWorkSec / 3600),
            Math.floor((offWorkSec % 3600) / 60),
            offWorkSec % 60,
          );
          checkintime_off_work = offWorkDate;
        }
      }

      // 处理异常信息 - 将秒转为分钟
      const exceptions = {};
      if (data.exception_infos && Array.isArray(data.exception_infos)) {
        data.exception_infos.forEach((item) => {
          if (!item || typeof item.exception !== 'number') return;

          switch (item.exception) {
            case 1: // 迟到
              exceptions['exception_late'] =
                typeof item.count === 'number' ? item.count : 0;
              // 秒转分钟，向上取整
              exceptions['late_duration'] =
                typeof item.duration === 'number'
                  ? Math.ceil(item.duration / 60)
                  : 0;
              break;
            case 2: // 早退
              exceptions['exception_early'] =
                typeof item.count === 'number' ? item.count : 0;
              // 秒转分钟，向上取整
              exceptions['early_duration'] =
                typeof item.duration === 'number'
                  ? Math.ceil(item.duration / 60)
                  : 0;
              break;
            case 3: // 缺卡
              exceptions['exception_absent'] =
                typeof item.count === 'number' ? item.count : 0;
              break;
            case 4: // 旷工
              exceptions['exception_missing'] =
                typeof item.count === 'number' ? item.count : 0;
              // 秒转分钟，向上取整
              exceptions['missing_duration'] =
                typeof item.duration === 'number'
                  ? Math.ceil(item.duration / 60)
                  : 0;
              break;
            case 5: // 地点异常
              exceptions['exception_location'] =
                typeof item.count === 'number' ? item.count : 0;
              break;
            case 6: // 设备异常
              exceptions['exception_device'] =
                typeof item.count === 'number' ? item.count : 0;
              break;
          }
        });
      }

      // 处理日期
      let date = null;
      try {
        if (typeof baseInfo.date === 'number' && baseInfo.date > 0) {
          date = new Date(baseInfo.date * 1000);
        } else {
          // 如果日期无效，使用当前日期
          date = new Date();
        }
      } catch (e) {
        date = new Date();
      }

      // 处理earliest_time和lastest_time
      // 这里时间戳是从0点开始的秒数，需要转换为时间对象
      let earliestTime = null;
      let lastestTime = null;

      try {
        if (
          typeof summaryInfo.earliest_time === 'number' &&
          !isNaN(summaryInfo.earliest_time)
        ) {
          const hours = Math.floor(summaryInfo.earliest_time / 3600);
          const minutes = Math.floor((summaryInfo.earliest_time % 3600) / 60);
          const seconds = summaryInfo.earliest_time % 60;

          const earliestDate = new Date(0);
          earliestDate.setUTCHours(hours, minutes, seconds);
          earliestTime = earliestDate;
        }
      } catch (e) {
        earliestTime = null;
      }

      try {
        if (
          typeof summaryInfo.lastest_time === 'number' &&
          !isNaN(summaryInfo.lastest_time)
        ) {
          const hours = Math.floor(summaryInfo.lastest_time / 3600);
          const minutes = Math.floor((summaryInfo.lastest_time % 3600) / 60);
          const seconds = summaryInfo.lastest_time % 60;

          const lastestDate = new Date(0);
          lastestDate.setUTCHours(hours, minutes, seconds);
          lastestTime = lastestDate;
        }
      } catch (e) {
        lastestTime = null;
      }

      // 处理假勤信息
      let spTitle = '';
      let spDescription = '';

      if (
        data.holiday_infos &&
        Array.isArray(data.holiday_infos) &&
        data.holiday_infos.length > 0
      ) {
        const holiday = data.holiday_infos[0];

        if (
          holiday &&
          holiday.sp_title &&
          holiday.sp_title.data &&
          Array.isArray(holiday.sp_title.data) &&
          holiday.sp_title.data.length > 0
        ) {
          spTitle = holiday.sp_title.data[0].text || '';
        }

        if (
          holiday &&
          holiday.sp_description &&
          holiday.sp_description.data &&
          Array.isArray(holiday.sp_description.data) &&
          holiday.sp_description.data.length > 0
        ) {
          spDescription = holiday.sp_description.data[0].text || '';
        }
      }

      // 秒转小时，保留2位小数
      const secondsToHours = (seconds: number): number => {
        if (typeof seconds !== 'number' || isNaN(seconds)) return 0;
        return parseFloat((seconds / 3600).toFixed(2));
      };

      // 返回转换后的数据
      return {
        // 基础信息
        date: date,
        record_type:
          typeof baseInfo.record_type === 'number'
            ? baseInfo.record_type
            : null,
        name: baseInfo.name || '',
        name_ex: baseInfo.name_ex || '',
        departs_name: baseInfo.departs_name || '',
        acctid: baseInfo.acctid || '',
        groupid: typeof ruleInfo.groupid === 'number' ? ruleInfo.groupid : null,
        groupname: ruleInfo.groupname || '',
        scheduleid:
          typeof ruleInfo.scheduleid === 'number' ? ruleInfo.scheduleid : null,
        schedulename: ruleInfo.schedulename || '',
        checkintime_work: checkintime_work,
        checkintime_off_work: checkintime_off_work,
        day_type:
          typeof baseInfo.day_type === 'number' ? baseInfo.day_type : null,

        // 汇总信息
        checkin_count:
          typeof summaryInfo.checkin_count === 'number'
            ? summaryInfo.checkin_count
            : null,
        regular_work_sec: secondsToHours(summaryInfo.regular_work_sec),
        standard_work_sec: secondsToHours(summaryInfo.standard_work_sec),
        earliest_time: earliestTime,
        lastest_time: lastestTime,

        // 异常信息
        ...exceptions,

        // 加班信息
        ot_status: typeof otInfo.ot_status === 'number' ? otInfo.ot_status : 0,
        ot_duration: secondsToHours(otInfo.ot_duration),
        exception_duration: secondsToHours(otInfo.exception_duration),
        workday_over_as_vacation: secondsToHours(
          otInfo.workday_over_as_vacation,
        ),
        workday_over_as_money: secondsToHours(otInfo.workday_over_as_money),
        restday_over_as_vacation: secondsToHours(
          otInfo.restday_over_as_vacation,
        ),
        restday_over_as_money: secondsToHours(otInfo.restday_over_as_money),
        holiday_over_as_vacation: secondsToHours(
          otInfo.holiday_over_as_vacation,
        ),
        holiday_over_as_money: secondsToHours(otInfo.holiday_over_as_money),

        // 假勤信息
        sp_number:
          data.holiday_infos && data.holiday_infos.length > 0
            ? data.holiday_infos[0].sp_number
            : null,
        sp_title: spTitle,
        sp_description: spDescription,

        // 假勤统计
        sp_items: JSON.stringify(data.sp_items || []),

        // 原始数据
        raw_data: JSON.stringify(data),
      };
    } catch (error) {
      console.error('转换考勤数据出错:', error);
      throw error;
    }
  }
}
