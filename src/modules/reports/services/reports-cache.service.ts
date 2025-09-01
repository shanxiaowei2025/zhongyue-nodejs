import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ReportCache } from '../entities/report-cache.entity';

@Injectable()
export class ReportsCacheService {
  private readonly logger = new Logger(ReportsCacheService.name);

  constructor(
    @InjectRepository(ReportCache)
    private cacheRepository: Repository<ReportCache>,
  ) {}

  /**
   * 获取当前UTC时间
   */
  private getCurrentUTCTime(): Date {
    return new Date();
  }

  /**
   * 获取缓存数据
   */
  async getCache(
    reportType: string,
    cacheKey: string,
    userId?: number
  ): Promise<any> {
    try {
      const nowUTC = this.getCurrentUTCTime();
      
      // 添加详细的时间调试日志
      this.logger.debug(`查询缓存 - 当前UTC时间: ${nowUTC.toISOString()}, 本地时间: ${nowUTC.toString()}`);
      
      const cache = await this.cacheRepository.findOne({
        where: {
          reportType,
          cacheKey,
          userId,
          expiresAt: MoreThan(nowUTC) // 使用UTC时间进行比较
        }
      });

      if (cache) {
        this.logger.debug(`缓存命中: ${reportType}-${cacheKey}-${userId}`);
        this.logger.debug(`缓存过期时间: ${cache.expiresAt.toISOString()}, 当前UTC时间: ${nowUTC.toISOString()}`);
        return cache.cacheData;
      }

      this.logger.debug(`缓存未命中: ${reportType}-${cacheKey}-${userId}`);
      return null;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async setCache(
    reportType: string,
    cacheKey: string,
    data: any,
    ttl: number = 3600, // 默认1小时
    userId?: number
  ): Promise<void> {
    try {
      const nowUTC = this.getCurrentUTCTime();
      const expiresAtUTC = new Date(nowUTC.getTime() + ttl * 1000);

      // 添加详细的时间调试日志
      this.logger.debug(`设置缓存 - 当前UTC时间: ${nowUTC.toISOString()}, 过期UTC时间: ${expiresAtUTC.toISOString()}, TTL: ${ttl}s`);

      // 使用upsert操作，如果存在则更新，不存在则创建
      await this.cacheRepository.save({
        reportType,
        cacheKey,
        cacheData: data,
        userId,
        expiresAt: expiresAtUTC
      });

      this.logger.debug(`缓存设置成功: ${reportType}-${cacheKey}-${userId}, 过期时间: ${expiresAtUTC.toISOString()}`);
    } catch (error) {
      this.logger.error(`设置缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 删除指定缓存
   */
  async deleteCache(
    reportType: string,
    cacheKey: string,
    userId?: number
  ): Promise<void> {
    try {
      await this.cacheRepository.delete({
        reportType,
        cacheKey,
        userId
      });

      this.logger.debug(`缓存删除成功: ${reportType}-${cacheKey}-${userId}`);
    } catch (error) {
      this.logger.error(`删除缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 清除指定用户的所有缓存
   */
  async clearUserCache(userId: number): Promise<void> {
    try {
      await this.cacheRepository.delete({ userId });
      this.logger.debug(`用户缓存清除成功: ${userId}`);
    } catch (error) {
      this.logger.error(`清除用户缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 清除用户角色变更相关的缓存
   * 当用户角色发生变更时，需要清除该用户的所有报表缓存，确保获取到正确的权限数据
   */
  async clearUserRoleChangeCache(userId: number): Promise<void> {
    try {
      // 清除该用户的所有缓存
      await this.cacheRepository.delete({ userId });
      
      // 如果用户可能变成了管理员，还需要清除一些可能与管理员权限相关的缓存
      // 这里我们可以清除一些通用的缓存键模式
      const adminCachePatterns = [
        'admin',
        'all_data',
        'global'
      ];
      
      // 查找并删除可能包含管理员数据的缓存
      for (const pattern of adminCachePatterns) {
        const cachesToDelete = await this.cacheRepository
          .createQueryBuilder('cache')
          .where('cache.cacheKey LIKE :pattern', { pattern: `%${pattern}%` })
          .getMany();
        
        if (cachesToDelete.length > 0) {
          await this.cacheRepository.remove(cachesToDelete);
          this.logger.debug(`清除包含模式 "${pattern}" 的缓存，数量: ${cachesToDelete.length}`);
        }
      }
      
      this.logger.log(`用户 ${userId} 角色变更缓存清理完成`);
    } catch (error) {
      this.logger.error(`清除用户角色变更缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 批量清除多个用户的缓存
   * 适用于批量角色变更的场景
   */
  async clearMultipleUserCache(userIds: number[]): Promise<void> {
    try {
      if (userIds.length === 0) {
        return;
      }

      await this.cacheRepository.delete({ 
        userId: In(userIds) 
      });
      
      this.logger.log(`批量清除用户缓存完成，用户数量: ${userIds.length}`);
    } catch (error) {
      this.logger.error(`批量清除用户缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 清除指定报表类型的所有缓存
   */
  async clearReportTypeCache(reportType: string): Promise<void> {
    try {
      await this.cacheRepository.delete({ reportType });
      this.logger.debug(`报表类型缓存清除成功: ${reportType}`);
    } catch (error) {
      this.logger.error(`清除报表类型缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(params: Record<string, any>): string {
    // 将参数按键排序后序列化，确保相同参数生成相同的键
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {} as Record<string, any>);

    return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
  }

  /**
   * 清除过期缓存 - 定时任务
   * 每天凌晨2点执行
   */
  @Cron('0 2 * * *')
  async clearExpiredCache(): Promise<void> {
    try {
      const nowUTC = this.getCurrentUTCTime();
      
      // 添加详细的时间调试日志
      this.logger.log(`开始清理过期缓存 - 当前UTC时间: ${nowUTC.toISOString()}, 本地时间: ${nowUTC.toString()}`);
      
      const deleteResult = await this.cacheRepository.delete({
        expiresAt: LessThan(nowUTC) // 使用UTC时间进行比较
      });

      this.logger.log(`清理过期缓存完成，删除 ${deleteResult.affected || 0} 条记录`);
    } catch (error) {
      this.logger.error(`清理过期缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalCaches: number;
    validCaches: number;
    expiredCaches: number;
    cachesByType: Record<string, number>;
  }> {
    try {
      const now = new Date();
      
      const totalCaches = await this.cacheRepository.count();
      const validCaches = await this.cacheRepository.count({
        where: { expiresAt: MoreThan(now) }
      });
      const expiredCaches = await this.cacheRepository.count({
        where: { expiresAt: LessThan(now) }
      });

      // 按类型统计
      const typeStats = await this.cacheRepository
        .createQueryBuilder('cache')
        .select('cache.reportType', 'reportType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('cache.reportType')
        .getRawMany();

      const cachesByType = typeStats.reduce((acc, stat) => {
        acc[stat.reportType] = parseInt(stat.count);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCaches,
        validCaches,
        expiredCaches,
        cachesByType
      };
    } catch (error) {
      this.logger.error(`获取缓存统计失败: ${error.message}`, error.stack);
      return {
        totalCaches: 0,
        validCaches: 0,
        expiredCaches: 0,
        cachesByType: {}
      };
    }
  }

  /**
   * 预热缓存 - 可以在系统启动时调用
   */
  async warmupCache(): Promise<void> {
    this.logger.log('开始预热报表缓存...');
    
    try {
      // 这里可以预加载一些常用的报表数据
      // 例如：上个月的新增客户统计、客户等级分布等
      
      this.logger.log('报表缓存预热完成');
    } catch (error) {
      this.logger.error(`缓存预热失败: ${error.message}`, error.stack);
    }
  }
} 