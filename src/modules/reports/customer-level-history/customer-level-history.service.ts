import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CustomerLevelHistory } from './entities/customer-level-history.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { CreateLevelHistoryDto } from './dto/create-level-history.dto';
import { QueryLevelHistoryDto } from './dto/query-level-history.dto';
import {
  LevelHistoryResponseDto,
  LevelHistoryItemDto,
  CustomerLevelAtTimeDto,
} from './dto/level-history-response.dto';

@Injectable()
export class CustomerLevelHistoryService {
  private readonly logger = new Logger(CustomerLevelHistoryService.name);

  constructor(
    @InjectRepository(CustomerLevelHistory)
    private levelHistoryRepository: Repository<CustomerLevelHistory>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * 创建客户等级历史记录
   */
  async createLevelHistory(createDto: CreateLevelHistoryDto): Promise<CustomerLevelHistory> {
    try {
      this.logger.log(`创建客户等级历史记录: ${JSON.stringify(createDto)}`);

      const levelHistory = this.levelHistoryRepository.create({
        ...createDto,
        changeDate: new Date(createDto.changeDate),
      });

      const savedHistory = await this.levelHistoryRepository.save(levelHistory);
      this.logger.log(`成功创建客户等级历史记录，ID: ${savedHistory.id}`);

      return savedHistory;
    } catch (error) {
      this.logger.error(`创建客户等级历史记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 自动创建客户等级变更记录（供客户更新时调用）
   */
  async autoCreateLevelHistory(
    customerId: number,
    companyName: string,
    unifiedSocialCreditCode: string,
    previousLevel: string,
    currentLevel: string,
    changedBy?: string,
    changeReason?: string,
  ): Promise<void> {
    try {
      if (previousLevel === currentLevel) {
        this.logger.log(`客户 ${companyName} 的等级未发生变化，跳过历史记录创建`);
        return;
      }

      const createDto: CreateLevelHistoryDto = {
        customerId,
        companyName,
        unifiedSocialCreditCode,
        previousLevel,
        currentLevel,
        changeDate: new Date().toISOString().split('T')[0], // 当前日期
        changeReason: changeReason || '系统自动记录',
        changedBy,
      };

      await this.createLevelHistory(createDto);
    } catch (error) {
      this.logger.error(
        `自动创建客户等级历史记录失败: ${error.message}`,
        error.stack,
      );
      // 不抛出异常，避免影响主流程
    }
  }

  /**
   * 查询客户等级历史记录
   */
  async findLevelHistory(query: QueryLevelHistoryDto): Promise<LevelHistoryResponseDto> {
    try {
      this.logger.log(`查询客户等级历史记录: ${JSON.stringify(query)}`);

      const queryBuilder = this.createQueryBuilder(query);

      // 获取总数
      const total = await queryBuilder.getCount();

      // 分页查询
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const records = await queryBuilder
        .orderBy('clh.changeDate', 'DESC')
        .addOrderBy('clh.id', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      // 获取统计信息
      const stats = await this.getStatistics(query);

      // 转换数据格式
      const data: LevelHistoryItemDto[] = records.map(record => ({
        id: record.id,
        customerId: record.customerId,
        companyName: record.companyName,
        unifiedSocialCreditCode: record.unifiedSocialCreditCode,
        previousLevel: record.previousLevel,
        currentLevel: record.currentLevel,
        changeDate: record.changeDate.toISOString().split('T')[0],
        changeReason: record.changeReason,
        changedBy: record.changedBy,
        remarks: record.remarks,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      };
    } catch (error) {
      this.logger.error(`查询客户等级历史记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据客户ID查询历史记录
   */
  async findByCustomerId(customerId: number): Promise<CustomerLevelHistory[]> {
    try {
      return await this.levelHistoryRepository.find({
        where: { customerId },
        order: { changeDate: 'DESC', id: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`查询客户ID ${customerId} 的历史记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取指定时间点的客户等级
   */
  async getCustomerLevelAtTime(
    customerId: number,
    targetDate: Date,
  ): Promise<string | null> {
    try {
      // 查找小于等于目标日期的最新等级记录
      const latestRecord = await this.levelHistoryRepository
        .createQueryBuilder('clh')
        .where('clh.customerId = :customerId', { customerId })
        .andWhere('clh.changeDate <= :targetDate', { targetDate })
        .orderBy('clh.changeDate', 'DESC')
        .addOrderBy('clh.id', 'DESC')
        .getOne();

      if (latestRecord) {
        return latestRecord.currentLevel;
      }

      // 如果没有历史记录，返回客户表中的当前等级
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        select: ['customerLevel'],
      });

      return customer?.customerLevel || null;
    } catch (error) {
      this.logger.error(
        `获取客户ID ${customerId} 在 ${targetDate} 的等级失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 批量获取多个客户在指定时间点的等级
   */
  async batchGetCustomerLevelAtTime(
    customerIds: number[],
    targetDate: Date,
  ): Promise<Map<number, string>> {
    try {
      const result = new Map<number, string>();

      if (customerIds.length === 0) {
        return result;
      }

      // 查询历史记录
      const historyRecords = await this.levelHistoryRepository
        .createQueryBuilder('clh')
        .select([
          'clh.customerId',
          'clh.currentLevel',
          'clh.changeDate',
          'ROW_NUMBER() OVER (PARTITION BY clh.customerId ORDER BY clh.changeDate DESC, clh.id DESC) as rn'
        ])
        .where('clh.customerId IN (:...customerIds)', { customerIds })
        .andWhere('clh.changeDate <= :targetDate', { targetDate })
        .getRawMany();

      // 筛选每个客户的最新记录
      const latestRecords = historyRecords.filter(record => record.rn === 1);
      const foundCustomerIds = new Set<number>();

      latestRecords.forEach(record => {
        result.set(record.clh_customerId, record.clh_currentLevel);
        foundCustomerIds.add(record.clh_customerId);
      });

      // 对于没有历史记录的客户，查询当前等级
      const missingCustomerIds = customerIds.filter(id => !foundCustomerIds.has(id));
      if (missingCustomerIds.length > 0) {
        const customers = await this.customerRepository
          .createQueryBuilder('customer')
          .select(['customer.id', 'customer.customerLevel'])
          .where('customer.id IN (:...ids)', { ids: missingCustomerIds })
          .getMany();

        customers.forEach(customer => {
          if (customer.customerLevel) {
            result.set(customer.id, customer.customerLevel);
          }
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `批量获取客户等级失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 创建查询构建器
   */
  private createQueryBuilder(query: QueryLevelHistoryDto): SelectQueryBuilder<CustomerLevelHistory> {
    const queryBuilder = this.levelHistoryRepository
      .createQueryBuilder('clh')
      .leftJoinAndSelect('clh.customer', 'customer');

    if (query.customerId) {
      queryBuilder.andWhere('clh.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.companyName) {
      queryBuilder.andWhere('clh.companyName LIKE :companyName', {
        companyName: `%${query.companyName}%`,
      });
    }

    if (query.unifiedSocialCreditCode) {
      queryBuilder.andWhere('clh.unifiedSocialCreditCode = :code', {
        code: query.unifiedSocialCreditCode,
      });
    }

    if (query.startDate) {
      queryBuilder.andWhere('clh.changeDate >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('clh.changeDate <= :endDate', {
        endDate: query.endDate,
      });
    }

    if (query.currentLevel) {
      queryBuilder.andWhere('clh.currentLevel = :currentLevel', {
        currentLevel: query.currentLevel,
      });
    }

    if (query.changedBy) {
      queryBuilder.andWhere('clh.changedBy LIKE :changedBy', {
        changedBy: `%${query.changedBy}%`,
      });
    }

    return queryBuilder;
  }

  /**
   * 获取统计信息
   */
  private async getStatistics(query: QueryLevelHistoryDto): Promise<any> {
    const queryBuilder = this.createQueryBuilder(query);

    const stats = await queryBuilder
      .select([
        'COUNT(clh.id) as totalChanges',
        'COUNT(DISTINCT clh.customerId) as affectedCustomers',
        'MAX(clh.changeDate) as lastChangeDate',
      ])
      .getRawOne();

    return {
      totalChanges: parseInt(stats.totalChanges) || 0,
      affectedCustomers: parseInt(stats.affectedCustomers) || 0,
      lastChangeDate: stats.lastChangeDate || null,
    };
  }
} 