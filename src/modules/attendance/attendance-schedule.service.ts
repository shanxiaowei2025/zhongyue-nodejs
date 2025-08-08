import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceScheduleService {
  private readonly logger = new Logger(AttendanceScheduleService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly attendanceService: AttendanceService,
  ) {}

  /**
   * 每天凌晨1点执行
   */
  @Cron('0 1 * * *')
  async syncAttendanceData() {
    this.logger.log('开始执行企业微信考勤数据同步...');

    try {
      // 步骤1：获取第一个access_token
      const corpId = this.configService.get<string>('CORPID');
      const corpSecretA = this.configService.get<string>('CORPSECRETA');

      if (!corpId || !corpSecretA) {
        this.logger.error('未配置CORPID或CORPSECRETA参数');
        return;
      }

      const token1 = await this.getAccessToken(corpId, corpSecretA);
      if (!token1) {
        this.logger.error('获取第一个access_token失败');
        return;
      }

      // 步骤2：获取用户ID列表
      const userIds = await this.getUserIds(token1);
      if (!userIds || userIds.length === 0) {
        this.logger.error('获取用户ID列表失败');
        return;
      }

      // 步骤3：获取第二个access_token
      const corpSecretB = this.configService.get<string>('CORPSECRETB');
      if (!corpSecretB) {
        this.logger.error('未配置CORPSECRETB参数');
        return;
      }

      const token2 = await this.getAccessToken(corpId, corpSecretB);
      if (!token2) {
        this.logger.error('获取第二个access_token失败');
        return;
      }

      // 步骤4：获取前一天的打卡数据并保存
      await this.getAndSaveCheckInData(token2, userIds);

      this.logger.log('企业微信考勤数据同步完成');
    } catch (error) {
      this.logger.error('企业微信考勤数据同步失败', error);
    }
  }

  /**
   * 获取企业微信access_token
   */
  private async getAccessToken(
    corpId: string,
    corpSecret: string,
  ): Promise<string | null> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`;
      this.logger.log(`正在请求access_token: ${url}`);

      const response = await axios.get(url);

      if (response.data && response.data.errcode === 0) {
        this.logger.log('获取access_token成功');
        return response.data.access_token;
      } else {
        this.logger.error('获取access_token错误', response.data);
        return null;
      }
    } catch (error) {
      this.logger.error('请求access_token异常', error);
      return null;
    }
  }

  /**
   * 获取用户ID列表
   */
  private async getUserIds(accessToken: string): Promise<string[]> {
    try {
      // 使用HTTPS协议而不是HTTP
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/list_id?access_token=${accessToken}`;
      this.logger.log(`正在请求用户ID列表: ${url}`);

      const response = await axios.post(
        url,
        {},
        {
          timeout: 10000, // 设置10秒超时
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (
        response.data &&
        response.data.errcode === 0 &&
        response.data.dept_user
      ) {
        // 提取所有用户ID
        const userIds = response.data.dept_user.map((user) => user.userid);
        this.logger.log(`成功获取${userIds.length}个用户ID`);
        return userIds;
      } else {
        this.logger.error('获取用户ID列表错误', response.data);

        // 检查是否是IP白名单问题
        if (response.data && response.data.errcode === 60020) {
          this.logger.warn(
            `IP访问限制错误，请确保服务器IP已添加到企业微信IP白名单中，当前请求IP: ${response.data.errmsg}`,
          );
          // 提取IP地址
          const ipMatch = response.data.errmsg.match(/from ip: ([^,]+)/);
          if (ipMatch && ipMatch[1]) {
            this.logger.warn(
              `请求IP: ${ipMatch[1]}, 请确认此IP已添加到企业微信后台的IP白名单中`,
            );
          }
        }

        return [];
      }
    } catch (error) {
      this.logger.error('请求用户ID列表异常', error);

      // 检查是否是网络问题
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.error('网络连接问题，请检查网络设置和防火墙配置');
      }

      return [];
    }
  }

  /**
   * 获取并保存打卡数据
   */
  private async getAndSaveCheckInData(
    accessToken: string,
    userIds: string[],
  ): Promise<void> {
    try {
      // 计算前一天的开始和结束时间戳
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const startTime = Math.floor(yesterday.getTime() / 1000);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      const endTime = Math.floor(endOfYesterday.getTime() / 1000);

      this.logger.log(
        `获取打卡数据时间范围: ${new Date(startTime * 1000).toISOString()} 到 ${new Date(endTime * 1000).toISOString()}`,
      );

      // 请求打卡数据
      const url = `https://qyapi.weixin.qq.com/cgi-bin/checkin/getcheckin_daydata?access_token=${accessToken}`;
      const response = await axios.post(
        url,
        {
          starttime: startTime,
          endtime: endTime,
          useridlist: userIds,
        },
        {
          timeout: 30000, // 设置30秒超时
        },
      );

      if (response.data && response.data.errcode === 0) {
        const attendanceData = response.data.datas || [];

        // 保存每条考勤记录
        for (const data of attendanceData) {
          await this.attendanceService.saveAttendanceData(data);
        }

        this.logger.log(`成功保存${attendanceData.length}条考勤记录`);
      } else {
        this.logger.error('获取打卡数据错误', response.data);
      }
    } catch (error) {
      this.logger.error('获取或保存打卡数据异常', error);
    }
  }

  /**
   * 手动触发同步（用于测试）
   */
  async manualSync(): Promise<void> {
    this.logger.log('手动触发考勤数据同步...');
    await this.syncAttendanceData();
  }
}
