import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'

/**
 * 报表缓存服务 - 占位实现（不使用数据库）
 * 为了保持编译兼容性并且彻底禁用基于数据库的缓存，此服务提供空操作的替代实现。
 * 所有方法均为 no-op 或返回 null，避免对缓存表的任何读写。
 */
@Injectable()
export class ReportsCacheService {
  private readonly logger = new Logger(ReportsCacheService.name)

  generateCacheKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {} as Record<string, any>)

    const jsonString = JSON.stringify(sortedParams)
    const hash = createHash('md5').update(jsonString).digest('hex')
    this.logger.debug(`(stub) 生成缓存键: ${hash}`)
    return hash
  }

  async getCache(_reportType: string, _cacheKey: string, _userId?: number): Promise<any> {
    // 不使用缓存，始终返回 null
    return null
  }

  async setCache(_reportType: string, _cacheKey: string, _data: any, _ttl = 3600, _userId?: number): Promise<void> {
    // no-op
    this.logger.debug('(stub) setCache 被调用，但已禁用数据库缓存')
  }

  async deleteCache(_reportType: string, _cacheKey: string, _userId?: number): Promise<void> {
    // no-op
    this.logger.debug('(stub) deleteCache 被调用，但已禁用数据库缓存')
  }

  async clearUserCache(_userId: number): Promise<void> {
    this.logger.debug('(stub) clearUserCache 被调用，但已禁用数据库缓存')
  }

  async clearUserRoleChangeCache(_userId: number): Promise<void> {
    this.logger.debug('(stub) clearUserRoleChangeCache 被调用，但已禁用数据库缓存')
  }

  // 兼容旧实现的定时清理接口 - 无实际操作
  async clearReportTypeCache(_reportType: string): Promise<void> {
    this.logger.debug('(stub) clearReportTypeCache 被调用，但已禁用数据库缓存')
  }
}


