import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CustomerStatusHistory } from './entities/customer-status-history.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { CreateStatusHistoryDto } from './dto/create-status-history.dto';
import { QueryStatusHistoryDto } from './dto/query-status-history.dto';
import {
  StatusHistoryResponseDto,
  StatusHistoryItemDto,
  CustomerStatusAtTimeDto,
} from './dto/status-history-response.dto';

@Injectable()
export class CustomerStatusHistoryService {
  private readonly logger = new Logger(CustomerStatusHistoryService.name);

  constructor(
    @InjectRepository(CustomerStatusHistory)
    private statusHistoryRepository: Repository<CustomerStatusHistory>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * 创建客户状态历史记录
   */
  async createStatusHistory(createDto: CreateStatusHistoryDto): Promise<CustomerStatusHistory> {
    try {
      this.logger.log(`创建客户状态历史记录: ${JSON.stringify(createDto)}`);

      const statusHistory = this.statusHistoryRepository.create({
        ...createDto,
        changeDate: new Date(createDto.changeDate),
      });

      return await this.statusHistoryRepository.save(statusHistory);
    } catch (error) {
      this.logger.error(`创建客户状态历史记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 自动创建客户状态历史记录
   * 当客户状态发生变更时调用
   */
  async autoCreateStatusHistory(
    customerId: number,
    companyName: string,
    unifiedSocialCreditCode: string,
    previousEnterpriseStatus: string,
    currentEnterpriseStatus: string,
    previousBusinessStatus: string,
    currentBusinessStatus: string,
    changedBy?: string,
    changeReason?: string,
  ): Promise<void> {
    try {
      // 检查状态是否真的有变化
      const hasEnterpriseStatusChange = previousEnterpriseStatus !== currentEnterpriseStatus;
      const hasBusinessStatusChange = previousBusinessStatus !== currentBusinessStatus;
      
      if (!hasEnterpriseStatusChange && !hasBusinessStatusChange) {
        this.logger.log('客户状态没有变化，跳过历史记录创建');
        return;
      }

      await this.statusHistoryRepository.save({
        customerId,
        companyName,
        unifiedSocialCreditCode,
        previousEnterpriseStatus,
        currentEnterpriseStatus,
        previousBusinessStatus,
        currentBusinessStatus,
        changeDate: new Date(),
        changeReason: changeReason || '系统自动记录',
        changedBy: changedBy || '系统',
      });

      this.logger.log(`已为客户 ${companyName} 创建状态历史记录`);
    } catch (error) {
      this.logger.error(`自动创建客户状态历史记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 查询客户状态历史记录
   */
  async findStatusHistory(query: QueryStatusHistoryDto): Promise<StatusHistoryResponseDto> {
    try {
      this.logger.log(`查询客户状态历史记录: ${JSON.stringify(query)}`);

      const queryBuilder = this.createQueryBuilder(query);

      // 获取总数
      const total = await queryBuilder.getCount();

      // 分页查询
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const records = await queryBuilder
        .orderBy('csh.changeDate', 'DESC')
        .addOrderBy('csh.id', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      // 获取统计信息
      const stats = await this.getStatistics(query);

      // 转换数据格式
      const data: StatusHistoryItemDto[] = records.map(record => ({
        id: record.id,
        customerId: record.customerId,
        companyName: record.companyName,
        unifiedSocialCreditCode: record.unifiedSocialCreditCode,
        previousEnterpriseStatus: record.previousEnterpriseStatus,
        currentEnterpriseStatus: record.currentEnterpriseStatus,
        previousBusinessStatus: record.previousBusinessStatus,
        currentBusinessStatus: record.currentBusinessStatus,
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
      this.logger.error(`查询客户状态历史记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据客户ID查询历史记录
   */
  async findByCustomerId(customerId: number): Promise<CustomerStatusHistory[]> {
    return await this.statusHistoryRepository.find({
      where: { customerId },
      order: { changeDate: 'DESC', id: 'DESC' },
    });
  }

  /**
   * 查询客户在指定时间点的状态
   */
  async getCustomerStatusAtTime(customerId: number, targetDate: string): Promise<CustomerStatusAtTimeDto | null> {
    try {
      this.logger.log(`查询客户 ${customerId} 在 ${targetDate} 的状态`);

      const date = new Date(targetDate);
      
      // 查找指定时间点之前的最新状态记录
      const latestRecord = await this.statusHistoryRepository
        .createQueryBuilder('csh')
        .where('csh.customerId = :customerId', { customerId })
        .andWhere('csh.changeDate <= :targetDate', { targetDate: date })
        .orderBy('csh.changeDate', 'DESC')
        .addOrderBy('csh.id', 'DESC')
        .getOne();

      if (!latestRecord) {
        // 如果没有历史记录，查询当前客户状态
        const customer = await this.customerRepository.findOne({
          where: { id: customerId }
        });

        if (!customer) {
          return null;
        }

        return {
          customerId: customer.id,
          companyName: customer.companyName,
          unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
          enterpriseStatus: customer.enterpriseStatus,
          businessStatus: customer.businessStatus,
          effectiveDate: customer.createTime?.toISOString().split('T')[0] || targetDate,
          isChurned: customer.enterpriseStatus === 'cancelled' || customer.businessStatus === 'lost',
        };
      }

      return {
        customerId: latestRecord.customerId,
        companyName: latestRecord.companyName,
        unifiedSocialCreditCode: latestRecord.unifiedSocialCreditCode,
        enterpriseStatus: latestRecord.currentEnterpriseStatus,
        businessStatus: latestRecord.currentBusinessStatus,
        effectiveDate: latestRecord.changeDate.toISOString().split('T')[0],
        isChurned: latestRecord.currentEnterpriseStatus === 'cancelled' || latestRecord.currentBusinessStatus === 'lost',
      };
    } catch (error) {
      this.logger.error(`查询客户状态失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量查询多个客户在指定时间点的状态
   */
  async getMultipleCustomerStatusAtTime(customerIds: number[], targetDate: string): Promise<CustomerStatusAtTimeDto[]> {
    const results: CustomerStatusAtTimeDto[] = [];
    
    for (const customerId of customerIds) {
      const status = await this.getCustomerStatusAtTime(customerId, targetDate);
      if (status) {
        results.push(status);
      }
    }

    return results;
  }

  /**
   * 创建查询构建器
   */
  private createQueryBuilder(query: QueryStatusHistoryDto): SelectQueryBuilder<CustomerStatusHistory> {
    const queryBuilder = this.statusHistoryRepository.createQueryBuilder('csh');

    // 客户ID过滤
    if (query.customerId) {
      queryBuilder.andWhere('csh.customerId = :customerId', { customerId: query.customerId });
    }

    // 企业名称模糊查询
    if (query.companyName) {
      queryBuilder.andWhere('csh.companyName LIKE :companyName', {
        companyName: `%${query.companyName}%`
      });
    }

    // 统一社会信用代码模糊查询
    if (query.unifiedSocialCreditCode) {
      queryBuilder.andWhere('csh.unifiedSocialCreditCode LIKE :code', {
        code: `%${query.unifiedSocialCreditCode}%`
      });
    }

    // 企业状态过滤
    if (query.currentEnterpriseStatus) {
      queryBuilder.andWhere('csh.currentEnterpriseStatus = :enterpriseStatus', {
        enterpriseStatus: query.currentEnterpriseStatus
      });
    }

    // 业务状态过滤
    if (query.currentBusinessStatus) {
      queryBuilder.andWhere('csh.currentBusinessStatus = :businessStatus', {
        businessStatus: query.currentBusinessStatus
      });
    }

    // 时间范围过滤
    if (query.startDate) {
      queryBuilder.andWhere('csh.changeDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('csh.changeDate <= :endDate', { endDate: query.endDate });
    }

    // 操作人员过滤
    if (query.changedBy) {
      queryBuilder.andWhere('csh.changedBy LIKE :changedBy', {
        changedBy: `%${query.changedBy}%`
      });
    }

    return queryBuilder;
  }

  /**
   * 获取统计信息
   */
  private async getStatistics(query: QueryStatusHistoryDto): Promise<any> {
    const baseQuery = this.createQueryBuilder(query);

    // 总变更次数
    const totalChanges = await baseQuery.getCount();

    // 流失客户数量（变更为cancelled或lost状态）
    const churnQuery = this.createQueryBuilder(query);
    churnQuery.andWhere(
      '(csh.currentEnterpriseStatus = :cancelled OR csh.currentBusinessStatus = :lost)',
      { cancelled: 'cancelled', lost: 'lost' }
    );
    const churnedCustomers = await churnQuery.getCount();

    // 恢复客户数量（从cancelled或lost状态变为正常状态）
    const recoveryQuery = this.createQueryBuilder(query);
    recoveryQuery.andWhere(
      '(csh.previousEnterpriseStatus = :cancelled OR csh.previousBusinessStatus = :lost)',
      { cancelled: 'cancelled', lost: 'lost' }
    );
    recoveryQuery.andWhere(
      'csh.currentEnterpriseStatus != :cancelled AND csh.currentBusinessStatus != :lost',
      { cancelled: 'cancelled', lost: 'lost' }
    );
    const recoveredCustomers = await recoveryQuery.getCount();

    // 企业状态变更统计
    const enterpriseStatusStats = await this.statusHistoryRepository
      .createQueryBuilder('csh')
      .select('csh.currentEnterpriseStatus as status, COUNT(*) as count')
      .groupBy('csh.currentEnterpriseStatus')
      .getRawMany();

    // 业务状态变更统计
    const businessStatusStats = await this.statusHistoryRepository
      .createQueryBuilder('csh')
      .select('csh.currentBusinessStatus as status, COUNT(*) as count')
      .groupBy('csh.currentBusinessStatus')
      .getRawMany();

    return {
      totalChanges,
      churnedCustomers,
      recoveredCustomers,
      enterpriseStatusChanges: enterpriseStatusStats.map(item => ({
        status: item.status,
        count: parseInt(item.count)
      })),
      businessStatusChanges: businessStatusStats.map(item => ({
        status: item.status,
        count: parseInt(item.count)
      }))
    };
  }
} 