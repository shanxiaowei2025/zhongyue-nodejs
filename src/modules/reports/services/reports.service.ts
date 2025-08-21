import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { Expense } from '../../expense/entities/expense.entity';
import { User } from '../../users/entities/user.entity';
import { ReportsPermissionService } from './reports-permission.service';
import { ReportsCacheService } from './reports-cache.service';
import {
  AgencyFeeAnalysisDto,
  NewCustomerStatsDto,
  EmployeePerformanceDto,
  CustomerLevelDistributionDto,
  CustomerChurnStatsDto,
  ServiceExpiryStatsDto,
  AccountantClientStatsDto,
} from '../dto/report-query.dto';
import {
  AgencyFeeAnalysisResponse,
  NewCustomerStatsResponse,
  EmployeePerformanceResponse,
  CustomerLevelDistributionResponse,
  CustomerChurnStatsResponse,
  ServiceExpiryStatsResponse,
  AccountantClientStatsResponse,
} from '../dto/report-response.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private permissionService: ReportsPermissionService,
    private cacheService: ReportsCacheService,
  ) {}

  /**
   * 代理费收费变化分析
   * 识别代理费今年相比去年减少≥阈值的客户
   */
  async getAgencyFeeAnalysis(
    query: AgencyFeeAnalysisDto,
    userId: number
  ): Promise<AgencyFeeAnalysisResponse> {
    try {
      this.logger.warn(`[DEBUG] 开始执行代理费收费变化分析，用户ID: ${userId}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'agency_fee_analysis'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看代理费收费变化分析报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        ...query,
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'agency_fee_analysis',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      const currentYear = query.year;
      const previousYear = currentYear - 1;
      const threshold = query.threshold;

      // 获取数据过滤条件
      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);
      const expenseFilter = await this.permissionService.getExpenseDataFilter(userId);

      this.logger.warn(`[DEBUG] 开始构建代理费分析查询，年份: ${currentYear}/${previousYear}，阈值: ${threshold}`);

      // 构建查询 - 今年和去年的代理费用对比
      const queryBuilder = this.expenseRepository
        .createQueryBuilder('expense')
        .select([
          'customer.id as customerId',
          'customer.companyName as companyName',
          'customer.unifiedSocialCreditCode as unifiedSocialCreditCode',
          'customer.consultantAccountant as consultantAccountant',
          'customer.bookkeepingAccountant as bookkeepingAccountant',
          'SUM(CASE WHEN YEAR(expense.chargeDate) = :currentYear THEN (COALESCE(expense.agencyFee, 0)) ELSE 0 END) as currentYearFee',
          'SUM(CASE WHEN YEAR(expense.chargeDate) = :previousYear THEN (COALESCE(expense.agencyFee, 0)) ELSE 0 END) as previousYearFee'
        ])
        .innerJoin(Customer, 'customer', 
          'customer.companyName = expense.companyName AND (' +
          '(customer.unifiedSocialCreditCode = expense.unifiedSocialCreditCode AND customer.unifiedSocialCreditCode IS NOT NULL AND expense.unifiedSocialCreditCode IS NOT NULL) OR ' +
          '(customer.unifiedSocialCreditCode IS NULL AND expense.unifiedSocialCreditCode IS NULL)' +
          ')'
        )
        .where('YEAR(expense.chargeDate) IN (:currentYear, :previousYear)', {
          currentYear,
          previousYear
        })
        .andWhere('expense.status = :status', { status: 1 })
        .andWhere('expense.agencyFee > 0')
        .groupBy('customer.id, customer.companyName, customer.unifiedSocialCreditCode, customer.consultantAccountant, customer.bookkeepingAccountant')
        .having('previousYearFee > 0') // 必须去年有费用
        .andHaving('(previousYearFee - currentYearFee) >= :threshold', { threshold });

      // 应用费用权限过滤（基于 expense_data_view_all、expense_data_view_by_location、expense_data_view_own）
      this.logger.warn(`[DEBUG] 应用费用权限过滤条件，用户ID: ${userId}`);
      await expenseFilter(queryBuilder as any);
      
      // 手动应用客户权限过滤条件（因为这是一个基于expense表的查询，需要特殊处理客户权限）
      this.logger.warn(`[DEBUG] 应用客户权限过滤条件，用户ID: ${userId}`);
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['department']
      });
      
      if (user && !user.roles?.includes('super_admin') && !user.roles?.includes('admin')) {
        const permissions = await this.permissionService.getUserPermissions(userId);
        
        if (!permissions.includes('customer_data_view_all')) {
          const customerConditions: string[] = [];
          const customerParams: any = {};

          // 检查按区域查看权限
          if (permissions.includes('customer_date_view_by_location') && user.department) {
            customerConditions.push('customer.location = :customerUserLocation');
            customerParams.customerUserLocation = user.department.name;
            this.logger.warn(`[DEBUG] 应用客户区域权限过滤，区域: ${user.department.name}`);
          }

          // 检查查看自己负责客户的权限
          if (permissions.includes('customer_date_view_own')) {
            customerConditions.push('(customer.consultantAccountant = :customerUsername OR customer.bookkeepingAccountant = :customerUsername OR customer.invoiceOfficer = :customerUsername)');
            customerParams.customerUsername = user.username;
            this.logger.warn(`[DEBUG] 应用客户负责人权限过滤，用户名: ${user.username}`);
          }

          if (customerConditions.length > 0) {
            queryBuilder.andWhere(`(${customerConditions.join(' OR ')})`, customerParams);
          } else {
            // 如果没有任何客户权限，返回空结果
            queryBuilder.andWhere('1 = 0');
          }
        }
      }

      const rawResults = await queryBuilder.getRawMany();
      this.logger.warn(`[DEBUG] 代理费分析查询返回原始结果数量: ${rawResults.length}`);

      // 处理结果
      const list = rawResults.map(item => ({
        customerId: parseInt(item.customerId),
        companyName: item.companyName,
        unifiedSocialCreditCode: item.unifiedSocialCreditCode,
        currentYearFee: parseFloat(item.currentYearFee) || 0,
        previousYearFee: parseFloat(item.previousYearFee) || 0,
        decreaseAmount: parseFloat(item.previousYearFee) - parseFloat(item.currentYearFee),
        decreaseRate: parseFloat(item.previousYearFee) > 0 
          ? ((parseFloat(item.previousYearFee) - parseFloat(item.currentYearFee)) / parseFloat(item.previousYearFee)) * 100 
          : 0,
        consultantAccountant: item.consultantAccountant,
        bookkeepingAccountant: item.bookkeepingAccountant,
      }));

      // 分页处理
      const total = list.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedList = list.slice(offset, offset + pageSize);

      // 汇总信息
      const summary = {
        totalCustomers: await this.getCustomerTotalCount(userId),
        affectedCustomers: total,
        totalDecrease: list.reduce((sum, item) => sum + item.decreaseAmount, 0),
        averageDecrease: total > 0 ? list.reduce((sum, item) => sum + item.decreaseAmount, 0) / total : 0,
      };

      const result: AgencyFeeAnalysisResponse = {
        list: paginatedList,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary,
      };

      // 缓存结果（30分钟）
      await this.cacheService.setCache(
        'agency_fee_analysis',
        cacheKey,
        result,
        1800,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`代理费收费变化分析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 新增客户统计
   */
  async getNewCustomerStats(
    query: NewCustomerStatsDto,
    userId: number
  ): Promise<NewCustomerStatsResponse> {
    try {
      this.logger.warn(`[DEBUG] 开始执行新增客户统计，用户ID: ${userId}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'new_customer_stats'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看新增客户统计报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        ...query,
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'new_customer_stats',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      // 构建查询条件
      let startDate: Date;
      let endDate: Date;

      if (query.startDate && query.endDate) {
        startDate = new Date(query.startDate);
        endDate = new Date(query.endDate);
      } else if (query.year && query.month) {
        startDate = new Date(query.year, query.month - 1, 1);
        endDate = new Date(query.year, query.month, 0);
      } else if (query.year) {
        startDate = new Date(query.year, 0, 1);
        endDate = new Date(query.year, 11, 31);
      } else {
        // 默认查询当前年度
        const currentYear = new Date().getFullYear();
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
      }

      this.logger.warn(`[DEBUG] 新增客户统计查询时间范围: ${startDate.toISOString()} 到 ${endDate.toISOString()}`);

      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);

      // 查询新增客户
      const queryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.createTime BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .orderBy('customer.createTime', 'DESC');

      this.logger.warn(`[DEBUG] 应用客户权限过滤到新增客户统计查询`);
      // 应用权限过滤
      await customerFilter(queryBuilder);

      const customers = await queryBuilder.getMany();
      this.logger.warn(`[DEBUG] 新增客户统计查询返回结果数量: ${customers.length}`);

      // 按月统计
      const monthlyStatsMap = new Map<string, any>();

      customers.forEach(customer => {
        const month = customer.createTime.toISOString().substring(0, 7); // YYYY-MM
        
        if (!monthlyStatsMap.has(month)) {
          monthlyStatsMap.set(month, {
            month,
            totalCount: 0,
            authorizedCount: 0,
            details: []
          });
        }

        const monthStats = monthlyStatsMap.get(month);
        monthStats.totalCount++;
        monthStats.authorizedCount++; // 用户看到的都是有权限的
        monthStats.details.push({
          customerId: customer.id,
          companyName: customer.companyName,
          unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
          createTime: customer.createTime.toISOString(),
          consultantAccountant: customer.consultantAccountant,
          bookkeepingAccountant: customer.bookkeepingAccountant,
          customerLevel: customer.customerLevel,
        });
      });

      const monthlyStats = Array.from(monthlyStatsMap.values())
        .sort((a, b) => a.month.localeCompare(b.month));

      const result: NewCustomerStatsResponse = {
        monthlyStats,
        summary: {
          totalNewCustomers: customers.length,
          averagePerMonth: monthlyStats.length > 0 
            ? customers.length / monthlyStats.length 
            : 0,
        },
      };

      // 缓存结果（1小时）
      await this.cacheService.setCache(
        'new_customer_stats',
        cacheKey,
        result,
        3600,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`新增客户统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 员工业绩统计
   */
  async getEmployeePerformance(
    query: EmployeePerformanceDto,
    userId: number
  ): Promise<EmployeePerformanceResponse> {
    try {
      this.logger.warn(`开始执行员工业绩统计，用户ID: ${userId}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'employee_performance'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看员工业绩统计报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        ...query,
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'employee_performance',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      // 确定查询月份
      let targetDate: Date;
      if (query.month) {
        targetDate = new Date(query.month + '-01');
      } else {
        // 默认查询当前月份
        targetDate = new Date();
      }

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth(); // getMonth() 返回 0-11
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // 获取用户信息和权限
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['department']
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const permissions = await this.permissionService.getUserPermissions(userId);
      this.logger.warn(`用户 ${userId} 的费用权限: ${permissions.join(', ')}`);

      // 查询已审核通过的费用，按业务员统计
      const queryBuilder = this.expenseRepository
        .createQueryBuilder('expense')
        .select([
          'expense.salesperson as employeeName',
          'SUM(CASE WHEN expense.businessType = "新增" THEN COALESCE(expense.agencyFee, 0) + COALESCE(expense.totalFee, 0) ELSE 0 END) as newCustomerRevenue',
          'SUM(CASE WHEN expense.businessType = "续费" THEN COALESCE(expense.agencyFee, 0) + COALESCE(expense.totalFee, 0) ELSE 0 END) as renewalRevenue',
          'SUM(CASE WHEN expense.businessType NOT IN ("新增", "续费") OR expense.businessType IS NULL THEN COALESCE(expense.agencyFee, 0) + COALESCE(expense.totalFee, 0) ELSE 0 END) as otherRevenue',
          'SUM(COALESCE(expense.agencyFee, 0) + COALESCE(expense.totalFee, 0)) as totalRevenue',
          'COUNT(DISTINCT expense.companyName) as customerCount'
        ])
        .where('expense.auditDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .andWhere('expense.status = :status', { status: 1 })
        .andWhere('expense.salesperson IS NOT NULL')
        .andWhere('expense.salesperson != ""')
        .groupBy('expense.salesperson');

      // 应用权限过滤条件
      if (!permissions.includes('expense_data_view_all')) {
        const conditions: string[] = [];
        const parameters: any = {};

        // 检查按区域查看权限
        if (permissions.includes('expense_data_view_by_location') && user.department) {
          conditions.push('expense.companyLocation = :userLocation');
          parameters.userLocation = user.department.name;
          this.logger.warn(`应用区域过滤，区域: ${user.department.name}`);
        }

        // 检查查看自己数据的权限
        if (permissions.includes('expense_data_view_own')) {
          conditions.push('expense.salesperson = :username');
          parameters.username = user.username;
                      this.logger.warn(`应用个人过滤，用户名: ${user.username}`);
        }

        // 如果没有任何权限条件，拒绝访问
        if (conditions.length === 0) {
          this.logger.warn(`用户 ${userId} 没有任何费用数据查看权限`);
          queryBuilder.andWhere('1 = 0');
        } else {
          // 使用 OR 连接多个权限条件
          queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);
          this.logger.warn(`应用权限过滤条件: ${conditions.join(' OR ')}`);
        }
      } else {
                  this.logger.warn(`用户 ${userId} 拥有查看所有费用数据权限`);
      }

      if (query.employeeName) {
        queryBuilder.andWhere('expense.salesperson LIKE :employeeName', {
          employeeName: `%${query.employeeName}%`
        });
      }

      // 执行查询前打印SQL
      const sql = queryBuilder.getQuery();
      const parameters = queryBuilder.getParameters();
              this.logger.warn(`员工业绩查询SQL: ${sql}`);
        this.logger.warn(`查询参数:`, parameters);

      const rawResults = await queryBuilder.getRawMany();
              this.logger.warn(`员工业绩查询返回原始结果数量: ${rawResults.length}`);
        this.logger.warn(`原始结果:`, rawResults);

      // 获取员工部门信息
      const employees = await this.userRepository.find({
        relations: ['department']
      });

      const employeeMap = new Map();
      employees.forEach(emp => {
        employeeMap.set(emp.username, emp.department?.name || '未分配');
      });

      this.logger.warn(`员工部门映射:`, Array.from(employeeMap.entries()));

      const employeesList = rawResults
        .filter(item => item.employeeName && item.totalRevenue > 0)
        .map(item => {
          const department = employeeMap.get(item.employeeName) || '未知部门';
          this.logger.warn(`映射员工 ${item.employeeName} -> 部门: ${department}, 收入: ${item.totalRevenue}`);
          return {
          employeeName: item.employeeName,
            department,
          newCustomerRevenue: parseFloat(item.newCustomerRevenue) || 0,
          renewalRevenue: parseFloat(item.renewalRevenue) || 0,
          otherRevenue: parseFloat(item.otherRevenue) || 0,
          totalRevenue: parseFloat(item.totalRevenue) || 0,
          customerCount: parseInt(item.customerCount) || 0,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // 部门过滤
      const filteredEmployees = query.department
        ? employeesList.filter(emp => emp.department.includes(query.department))
        : employeesList;

      const result: EmployeePerformanceResponse = {
        employees: filteredEmployees,
        summary: {
          totalRevenue: filteredEmployees.reduce((sum, emp) => sum + emp.totalRevenue, 0),
          averageRevenue: filteredEmployees.length > 0 
            ? filteredEmployees.reduce((sum, emp) => sum + emp.totalRevenue, 0) / filteredEmployees.length 
            : 0,
          topPerformer: filteredEmployees.length > 0 ? filteredEmployees[0].employeeName : '',
        },
      };

      // 缓存结果（30分钟）
      await this.cacheService.setCache(
        'employee_performance',
        cacheKey,
        result,
        1800,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`员工业绩统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 客户等级分布统计
   */
  async getCustomerLevelDistribution(
    query: CustomerLevelDistributionDto,
    userId: number
  ): Promise<CustomerLevelDistributionResponse> {
    try {
      this.logger.warn(`开始执行客户等级分布统计，用户ID: ${userId}, 查询参数: ${JSON.stringify(query)}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'customer_level_distribution'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看客户等级分布统计报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        ...query,
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'customer_level_distribution',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);

      // 构建时间过滤条件
      const timeFilter = this.buildTimeFilter(query.year, query.month);

      // 查询客户等级分布
      const queryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .select([
          'customer.customerLevel as level',
          'COUNT(*) as count',
          'SUM(COALESCE(customer.contributionAmount, 0)) as revenue'
        ])
        .where('customer.enterpriseStatus != :status', { status: '已注销' })
        .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' })
        .groupBy('customer.customerLevel')
        .orderBy('count', 'DESC');

      // 应用时间过滤
      if (timeFilter.condition) {
        queryBuilder.andWhere(timeFilter.condition, timeFilter.parameters);
      }

      // 应用权限过滤
      await customerFilter(queryBuilder);

      const rawResults = await queryBuilder.getRawMany();

      const totalCustomers = rawResults.reduce((sum, item) => sum + parseInt(item.count), 0);
      const totalRevenue = rawResults.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);

      const distribution = rawResults.map(item => ({
        level: item.level || '未分级',
        count: parseInt(item.count),
        percentage: totalCustomers > 0 ? (parseInt(item.count) / totalCustomers) * 100 : 0,
        revenue: parseFloat(item.revenue || 0),
      }));

      // 获取详细客户信息
      const details = await Promise.all(
        distribution.map(async (levelItem) => {
          const detailQueryBuilder = this.customerRepository
            .createQueryBuilder('customer')
            .select([
              'customer.id as customerId',
              'customer.companyName as companyName',
              'customer.unifiedSocialCreditCode as unifiedSocialCreditCode',
              'customer.contributionAmount as contributionAmount'
            ])
            .where('customer.customerLevel = :level', { level: levelItem.level })
            .andWhere('customer.enterpriseStatus != :status', { status: '已注销' })
            .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' })
            .orderBy('customer.contributionAmount', 'DESC')
            .limit(10); // 只取前10个客户

          // 应用时间过滤
          if (timeFilter.condition) {
            detailQueryBuilder.andWhere(timeFilter.condition, timeFilter.parameters);
          }

          await customerFilter(detailQueryBuilder);

          const customers = await detailQueryBuilder.getRawMany();

          return {
            level: levelItem.level,
            customers: customers.map(c => ({
              customerId: parseInt(c.customerId),
              companyName: c.companyName,
              unifiedSocialCreditCode: c.unifiedSocialCreditCode,
              contributionAmount: parseFloat(c.contributionAmount || 0),
            }))
          };
        })
      );

      const result: CustomerLevelDistributionResponse = {
        distribution,
        details,
        summary: {
          totalCustomers,
          totalRevenue,
        },
      };

      // 缓存结果（2小时）
      await this.cacheService.setCache(
        'customer_level_distribution',
        cacheKey,
        result,
        7200,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`客户等级分布统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 客户流失统计
   */
  async getCustomerChurnStats(
    query: CustomerChurnStatsDto,
    userId: number
  ): Promise<CustomerChurnStatsResponse> {
    try {
      this.logger.warn(`开始执行客户流失统计，用户ID: ${userId}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'customer_churn_stats'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看客户流失统计报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        ...query,
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'customer_churn_stats',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      // 构建时间过滤条件
      const timeFilter = this.buildTimeFilter(query.year, query.month);

      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);

      // 查询流失客户（enterpriseStatus为cancelled或businessStatus为lost）
      const queryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .where('(customer.enterpriseStatus = :status1 OR customer.businessStatus = :status2)', {
          status1: 'cancelled',
          status2: 'lost'
        });

      // 应用时间过滤
      if (timeFilter.condition) {
        // 替换字段名：从 createTime 改为 updateTime，因为流失统计关注的是更新时间
        const condition = timeFilter.condition.replace(/customer\.createTime/g, 'customer.updateTime');
        queryBuilder.andWhere(condition, timeFilter.parameters);
      }

      queryBuilder.orderBy('customer.updateTime', 'DESC');

      // 应用权限过滤
      await customerFilter(queryBuilder);

      const churnedCustomers = await queryBuilder.getMany();

      // 按期间统计
      const periodStatsMap = new Map<string, any>();

      churnedCustomers.forEach(customer => {
        let period: string;
        // 根据传入的参数决定统计维度
        if (query.year && !query.month) {
          // 只传year，按年统计
          period = customer.updateTime.getFullYear().toString();
        } else {
          // 其他情况都按月统计
          period = customer.updateTime.toISOString().substring(0, 7); // YYYY-MM
        }

        if (!periodStatsMap.has(period)) {
          periodStatsMap.set(period, {
            period,
            churnCount: 0,
            churnReasons: new Map<string, number>()
          });
        }

        const periodStats = periodStatsMap.get(period);
        periodStats.churnCount++;

        // 统计流失原因
        const reason = customer.enterpriseStatus === 'cancelled' ? '工商注销' : '业务流失';
        const reasonCount = periodStats.churnReasons.get(reason) || 0;
        periodStats.churnReasons.set(reason, reasonCount + 1);
      });

      // 转换为最终格式
      const churnStats = Array.from(periodStatsMap.values()).map(stats => ({
        period: stats.period,
        churnCount: stats.churnCount,
        churnRate: 0, // 这里需要总客户数来计算，暂时设为0
        churnReasons: Array.from(stats.churnReasons.entries()).map(([reason, count]) => ({
          reason,
          count
        }))
      })).sort((a, b) => a.period.localeCompare(b.period));

      // 流失客户详情
      const churnedCustomerItems = churnedCustomers.map(customer => ({
        customerId: customer.id,
        companyName: customer.companyName,
        unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
        churnDate: customer.updateTime.toISOString().split('T')[0],
        churnReason: customer.enterpriseStatus === 'cancelled' ? '工商注销' : '业务流失',
        lastServiceDate: customer.updateTime.toISOString().split('T')[0], // 简化处理
      }));

      const result: CustomerChurnStatsResponse = {
        churnStats,
        churnedCustomers: churnedCustomerItems,
        summary: {
          totalChurned: churnedCustomers.length,
          churnRate: 0, // 需要总客户数来计算
          recoveryOpportunities: churnedCustomers.filter(c => 
            c.businessStatus === 'lost' && c.enterpriseStatus !== 'cancelled'
          ).length,
        },
      };

      // 缓存结果（1小时）
      await this.cacheService.setCache(
        'customer_churn_stats',
        cacheKey,
        result,
        3600,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`客户流失统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 代理服务到期客户统计
   */
  async getServiceExpiryStats(
    query: ServiceExpiryStatsDto,
    userId: number
  ): Promise<ServiceExpiryStatsResponse> {
    try {
      this.logger.warn(`开始执行代理服务到期客户统计，用户ID: ${userId}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'service_expiry_stats'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看代理服务到期客户统计报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'service_expiry_stats',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      // 获取当前年月
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript月份从0开始

      const expenseFilter = await this.permissionService.getExpenseDataFilter(userId);

      // 查询每个公司代理费非空且agencyEndDate最大的记录
      const subQueryBuilder = this.expenseRepository
        .createQueryBuilder('expense_sub')
        .select([
          'expense_sub.companyName as companyName',
          'MAX(expense_sub.agencyEndDate) as maxAgencyEndDate'
        ])
        .where('expense_sub.agencyFee IS NOT NULL')
        .andWhere('expense_sub.agencyEndDate IS NOT NULL')
        .groupBy('expense_sub.companyName');

      const queryBuilder = this.expenseRepository
        .createQueryBuilder('expense')
        .select([
          'customer.id as customerId',
          'expense.agencyEndDate as agencyEndDate',
          'YEAR(expense.agencyEndDate) as endYear',
          'MONTH(expense.agencyEndDate) as endMonth'
        ])
        .innerJoin(Customer, 'customer', 'customer.companyName = expense.companyName')
        .innerJoin(
          `(${subQueryBuilder.getQuery()})`,
          'latest',
          'latest.companyName = expense.companyName AND latest.maxAgencyEndDate = expense.agencyEndDate'
        )
        .where('expense.agencyFee IS NOT NULL')
        .andWhere('expense.agencyEndDate IS NOT NULL');

      // 应用权限过滤
      await expenseFilter(queryBuilder);

      // 设置子查询的参数
      queryBuilder.setParameters(subQueryBuilder.getParameters());

      const rawResults = await queryBuilder.getRawMany();

      // 筛选出到期的客户（当前年月大于agencyEndDate的年月）
      const expiredCustomers = rawResults.filter(item => {
        const endYear = parseInt(item.endYear);
        const endMonth = parseInt(item.endMonth);
        
        // 当前年月大于代理结束年月，则为到期客户
        return currentYear > endYear || (currentYear === endYear && currentMonth > endMonth);
      }).map(item => ({
        customerId: parseInt(item.customerId),
        agencyEndDate: item.agencyEndDate,
      }));

      const result: ServiceExpiryStatsResponse = {
        totalExpiredCustomers: expiredCustomers.length,
        expiredCustomers,
      };

      // 缓存结果（30分钟）
      await this.cacheService.setCache(
        'service_expiry_stats',
        cacheKey,
        result,
        1800,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`代理服务到期客户统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 会计负责客户数量统计
   */
  async getAccountantClientStats(
    query: AccountantClientStatsDto,
    userId: number
  ): Promise<AccountantClientStatsResponse> {
    try {
      this.logger.warn(`开始执行会计负责客户数量统计，用户ID: ${userId}`);

      // 检查权限
      const hasPermission = await this.permissionService.checkReportPermission(
        userId,
        'accountant_client_stats'
      );
      if (!hasPermission) {
        throw new Error('您没有权限查看会计负责客户数量统计报表');
      }

      // 生成缓存键
      const cacheKey = this.cacheService.generateCacheKey({
        ...query,
        userId: await this.permissionService.isAdmin(userId) ? 'admin' : userId
      });

      // 尝试从缓存获取
      const cachedData = await this.cacheService.getCache(
        'accountant_client_stats',
        cacheKey,
        userId
      );
      if (cachedData) {
        return cachedData;
      }

      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);

      // 查询顾问会计统计
      const consultantStats = new Map<string, any>();
      if (query.accountantType === 'all' || query.accountantType === 'consultantAccountant') {
        const consultantQueryBuilder = this.customerRepository
          .createQueryBuilder('customer')
          .select([
            'customer.consultantAccountant as accountantName',
            'COUNT(*) as clientCount'
          ])
          .where('customer.consultantAccountant IS NOT NULL')
          .andWhere('customer.consultantAccountant != ""')
          .andWhere('customer.enterpriseStatus != :status', { status: '已注销' })
          .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' })
          .groupBy('customer.consultantAccountant');

        if (query.accountantName) {
          consultantQueryBuilder.andWhere('customer.consultantAccountant LIKE :name', {
            name: `%${query.accountantName}%`
          });
        }

        await customerFilter(consultantQueryBuilder);

        const consultantResults = await consultantQueryBuilder.getRawMany();
        
        consultantResults.forEach(item => {
          if (item.accountantName) {
            consultantStats.set(item.accountantName, {
              accountantName: item.accountantName,
              accountantType: 'consultantAccountant' as const,
              clientCount: parseInt(item.clientCount),
            });
          }
        });
      }

      // 查询记账会计统计
      const bookkeepingStats = new Map<string, any>();
      if (query.accountantType === 'all' || query.accountantType === 'bookkeepingAccountant') {
        const bookkeepingQueryBuilder = this.customerRepository
          .createQueryBuilder('customer')
          .select([
            'customer.bookkeepingAccountant as accountantName',
            'COUNT(*) as clientCount'
          ])
          .where('customer.bookkeepingAccountant IS NOT NULL')
          .andWhere('customer.bookkeepingAccountant != ""')
          .andWhere('customer.enterpriseStatus != :status', { status: '已注销' })
          .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' })
          .groupBy('customer.bookkeepingAccountant');

        if (query.accountantName) {
          bookkeepingQueryBuilder.andWhere('customer.bookkeepingAccountant LIKE :name', {
            name: `%${query.accountantName}%`
          });
        }

        await customerFilter(bookkeepingQueryBuilder);

        const bookkeepingResults = await bookkeepingQueryBuilder.getRawMany();
        
        bookkeepingResults.forEach(item => {
          if (item.accountantName) {
            bookkeepingStats.set(item.accountantName, {
              accountantName: item.accountantName,
              accountantType: 'bookkeepingAccountant' as const,
              clientCount: parseInt(item.clientCount),
            });
          }
        });
      }

      // 查询开票员统计
      const invoiceStats = new Map<string, any>();
      if (query.accountantType === 'all' || query.accountantType === 'invoiceOfficer') {
        const invoiceQueryBuilder = this.customerRepository
          .createQueryBuilder('customer')
          .select([
            'customer.invoiceOfficer as accountantName',
            'COUNT(*) as clientCount'
          ])
          .where('customer.invoiceOfficer IS NOT NULL')
          .andWhere('customer.invoiceOfficer != ""')
          .andWhere('customer.enterpriseStatus != :status', { status: '已注销' })
          .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' })
          .groupBy('customer.invoiceOfficer');

        if (query.accountantName) {
          invoiceQueryBuilder.andWhere('customer.invoiceOfficer LIKE :name', {
            name: `%${query.accountantName}%`
          });
        }

        await customerFilter(invoiceQueryBuilder);

        const invoiceResults = await invoiceQueryBuilder.getRawMany();
        
        invoiceResults.forEach(item => {
          if (item.accountantName) {
            invoiceStats.set(item.accountantName, {
              accountantName: item.accountantName,
              accountantType: 'invoiceOfficer' as const,
              clientCount: parseInt(item.clientCount),
            });
          }
        });
      }

      // 合并统计结果
      const accountants = [
        ...Array.from(consultantStats.values()),
        ...Array.from(bookkeepingStats.values()),
        ...Array.from(invoiceStats.values())
      ];

      // 获取员工部门信息
      const users = await this.userRepository.find({
        relations: ['department']
      });

      const userDepartmentMap = new Map();
      users.forEach(user => {
        userDepartmentMap.set(user.username, user.department?.name || '未分配');
      });

      // 添加部门信息
      accountants.forEach(accountant => {
        accountant.department = userDepartmentMap.get(accountant.accountantName) || '未知部门';
      });

      // 排序
      accountants.sort((a, b) => b.clientCount - a.clientCount);

      const result: AccountantClientStatsResponse = {
        accountants,
      };

      // 缓存结果（2小时）
      await this.cacheService.setCache(
        'accountant_client_stats',
        cacheKey,
        result,
        7200,
        userId
      );

      return result;
    } catch (error) {
      this.logger.error(`会计负责客户数量统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取用户有权限的客户总数
   */
  private async getCustomerTotalCount(userId: number): Promise<number> {
    try {
      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);
      const queryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.enterpriseStatus != :status', { status: '已注销' });

      await customerFilter(queryBuilder);

      return await queryBuilder.getCount();
    } catch (error) {
      this.logger.error(`获取客户总数失败: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * 构建时间过滤条件
   * @param year 年份
   * @param month 月份
   * @returns 时间过滤条件和参数
   */
  private buildTimeFilter(year?: number, month?: number): {
    condition: string | null;
    parameters: any;
  } {
    const now = new Date();
    let targetYear = year;
    let targetMonth = month;

    // 如果都没有填写参数，默认按当前年月统计
    if (!year && !month) {
      targetYear = now.getFullYear();
      targetMonth = now.getMonth() + 1; // JavaScript月份从0开始，需要+1
    } 
    // 如果只填写了month，默认按当年的参数月份统计
    else if (!year && month) {
      targetYear = now.getFullYear();
      targetMonth = month;
    }
    // 如果只填写了year，按年统计
    else if (year && !month) {
      targetYear = year;
      targetMonth = null; // 不设置月份，按年统计
    }
    // 如果填写了year和month，按参数的年月统计
    else if (year && month) {
      targetYear = year;
      targetMonth = month;
    }

    try {
      if (targetMonth) {
        // 按月统计：统计指定年月的数据
        const startDate = new Date(targetYear, targetMonth - 1, 1); // 月初（JavaScript月份从0开始）
        const endDate = new Date(targetYear, targetMonth, 1); // 下个月月初

        this.logger.warn(`按月统计: ${targetYear}年${targetMonth}月，时间范围: ${startDate.toISOString()} - ${endDate.toISOString()}`);

        return {
          condition: 'customer.createTime >= :startDate AND customer.createTime < :endDate',
          parameters: {
            startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
            endDate: endDate.toISOString().slice(0, 19).replace('T', ' ')
          }
        };
      } else {
        // 按年统计：统计指定年份的数据
        const startDate = new Date(targetYear, 0, 1); // 年初
        const endDate = new Date(targetYear + 1, 0, 1); // 下一年年初

        this.logger.warn(`按年统计: ${targetYear}年，时间范围: ${startDate.toISOString()} - ${endDate.toISOString()}`);

        return {
          condition: 'customer.createTime >= :startDate AND customer.createTime < :endDate',
          parameters: {
            startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
            endDate: endDate.toISOString().slice(0, 19).replace('T', ' ')
          }
        };
      }
    } catch (error) {
      this.logger.error(`构建时间过滤条件失败: ${error.message}`, error.stack);
      return { condition: null, parameters: {} };
    }
  }
} 