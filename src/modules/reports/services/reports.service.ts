import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { Expense } from '../../expense/entities/expense.entity';
import { User } from '../../users/entities/user.entity';
import { CustomerLevelHistory } from '../customer-level-history/entities/customer-level-history.entity';
import { CustomerStatusHistory } from '../customer-status-history/entities/customer-status-history.entity';
import { ReportsPermissionService } from './reports-permission.service';
import { ReportsCacheService } from './reports-cache.service';
import { CustomerLevelHistoryService } from '../customer-level-history/customer-level-history.service';
import { CustomerStatusHistoryService } from '../customer-status-history/customer-status-history.service';
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
import { DateUtils } from '../../../common/utils/date.utils';

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
    @InjectRepository(CustomerLevelHistory)
    private customerLevelHistoryRepository: Repository<CustomerLevelHistory>,
    @InjectRepository(CustomerStatusHistory)
    private customerStatusHistoryRepository: Repository<CustomerStatusHistory>,
    private permissionService: ReportsPermissionService,
    private cacheService: ReportsCacheService,
    private levelHistoryService: CustomerLevelHistoryService,
    private statusHistoryService: CustomerStatusHistoryService,
  ) {}

  /**
   * 应用排序到数组数据
   * @param data 要排序的数据数组
   * @param sortField 排序字段
   * @param sortOrder 排序顺序：ASC 或 DESC
   */
  private applySortToArray<T extends Record<string, any>>(
    data: T[], 
    sortField?: string, 
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): T[] {
    if (!sortField || !data.length) {
      return data;
    }

    return data.sort((a, b) => {
      const valueA = this.getNestedValue(a, sortField);
      const valueB = this.getNestedValue(b, sortField);

      // 处理 null/undefined 值
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return sortOrder === 'ASC' ? -1 : 1;
      if (valueB == null) return sortOrder === 'ASC' ? 1 : -1;

      // 数字比较
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'ASC' ? valueA - valueB : valueB - valueA;
      }

      // 日期比较
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortOrder === 'ASC' 
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      // 字符串比较
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      
      if (sortOrder === 'ASC') {
        return strA.localeCompare(strB, 'zh-CN');
      } else {
        return strB.localeCompare(strA, 'zh-CN');
      }
    });
  }

  /**
   * 应用排序到 TypeORM QueryBuilder
   * @param queryBuilder TypeORM查询构建器
   * @param alias 表别名
   * @param sortField 排序字段
   * @param sortOrder 排序顺序
   */
  private applySortToQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    alias: string,
    sortField?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): void {
    if (sortField) {
      // 验证字段名，避免SQL注入
      const safeField = sortField.replace(/[^a-zA-Z0-9_]/g, '');
      if (safeField) {
        queryBuilder.orderBy(`${alias}.${safeField}`, sortOrder);
      }
    }
  }

  /**
   * 获取嵌套对象的值
   * @param obj 对象
   * @param path 路径，支持点号分隔（如：'user.name'）
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

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

      // 应用排序
      const validSortField = this.validateSortField('agencyFeeAnalysis', query.sortField);
      const sortedList = this.applySortToArray(list, validSortField, query.sortOrder);

      // 分页处理
      const total = sortedList.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedList = sortedList.slice(offset, offset + pageSize);

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
        });

      // 应用排序
      const validSortField = this.validateSortField('newCustomerStats', query.sortField);
      this.applySortToQueryBuilder(queryBuilder, 'customer', validSortField, query.sortOrder);

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

      // 应用分页
      const total = monthlyStats.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedStats = monthlyStats.slice(offset, offset + pageSize);

      const result: NewCustomerStatsResponse = {
        list: paginatedStats,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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
        });

      // 应用排序
      const validSortField = this.validateSortField('employeePerformance', query.sortField);
      const sortedEmployees = this.applySortToArray(employeesList, validSortField, query.sortOrder);

      // 部门过滤
      const filteredEmployees = query.department
        ? sortedEmployees.filter(emp => emp.department.includes(query.department))
        : sortedEmployees;

      // 分页处理
      const total = filteredEmployees.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedEmployees = filteredEmployees.slice(offset, offset + pageSize);

      const result: EmployeePerformanceResponse = {
        list: paginatedEmployees,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          totalRevenue: filteredEmployees.reduce((sum, emp) => sum + emp.totalRevenue, 0),
          averageRevenue: filteredEmployees.length > 0 
            ? filteredEmployees.reduce((sum, emp) => sum + emp.totalRevenue, 0) / filteredEmployees.length 
            : 0,
          topPerformer: filteredEmployees.length > 0 
            ? filteredEmployees.reduce((max, emp) => 
                emp.totalRevenue > max.totalRevenue ? emp : max
              ).employeeName 
            : '',
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
   * 基于 customer_level_history 表统计客户等级分布情况
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

      // 确定查询的截止日期
      const targetDate = this.getTargetDateForHistory(query.year, query.month);
      this.logger.warn(`使用目标日期: ${targetDate.toISOString()}`);

      // 获取客户数据权限过滤条件
      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);

      // 基于 customer_level_history 表统计等级分布
      const rawResults = await this.getCustomerLevelDistributionFromHistory(targetDate, customerFilter);

      const totalCustomers = rawResults.reduce((sum, item) => sum + parseInt(item.count), 0);
      const totalRevenue = rawResults.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);

      const distributionList = rawResults.map(item => ({
        level: this.cleanCustomerLevel(item.level) || '未分级',
        count: parseInt(item.count),
        percentage: totalCustomers > 0 ? (parseInt(item.count) / totalCustomers) * 100 : 0,
        revenue: parseFloat(item.revenue || 0),
      }));

      // 应用排序
      const validSortField = this.validateSortField('customerLevelDistribution', query.sortField);
      const distribution = this.applySortToArray(distributionList, validSortField, query.sortOrder);

      // 获取详细客户信息
      const details = await Promise.all(
        distribution.map(async (levelItem) => {
          const customers = await this.getCustomerDetailsByLevelFromHistory(
            levelItem.level,
            targetDate,
            customerFilter
          );

          return {
            level: levelItem.level,
            customers
          };
        })
      );

      // 应用分页
      const total = distribution.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedDistribution = distribution.slice(offset, offset + pageSize);

      const result: CustomerLevelDistributionResponse = {
        list: paginatedDistribution,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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
   * 客户流失统计 - 基于状态历史记录实现
   */
  async getCustomerChurnStats(
    query: CustomerChurnStatsDto,
    userId: number
  ): Promise<CustomerChurnStatsResponse> {
    try {
      this.logger.warn(`开始执行客户流失统计，用户ID: ${userId}, 查询参数: ${JSON.stringify(query)}`);

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

      // 确定查询的截止日期（与客户等级分布统计相同的逻辑）
      const targetDate = this.getTargetDateForHistory(query.year, query.month);
      this.logger.warn(`使用目标日期: ${targetDate.toISOString()}`);

      // 获取客户数据权限过滤条件
      const customerFilter = await this.permissionService.getCustomerDataFilter(userId);

      // 基于 customer_status_history 表统计符合条件的记录
      const statusResults = await this.getCustomerChurnStatsFromHistory(targetDate, customerFilter);

      // 分别统计 cancelled 和 lost 状态的记录
      const cancelledEnterpriseRecords = statusResults.filter(r => r.currentEnterpriseStatus === 'cancelled');
      const lostBusinessRecords = statusResults.filter(r => r.currentBusinessStatus === 'lost');

      // 按期间统计
      const periodStatsMap = new Map<string, any>();

      // 统计 cancelled 企业状态记录
      cancelledEnterpriseRecords.forEach(record => {
        let period: string;
        const changeDate = new Date(record.churnDate);
        
        // 根据传入的参数决定统计维度
        if (query.year && !query.month) {
          // 只传year，按年统计
          period = changeDate.getFullYear().toString();
        } else {
          // 其他情况都按月统计
          period = changeDate.toISOString().substring(0, 7); // YYYY-MM
        }

        if (!periodStatsMap.has(period)) {
          periodStatsMap.set(period, {
            period,
            cancelledEnterpriseCount: 0,
            lostBusinessCount: 0,
            totalCount: 0,
            statusReasons: new Map<string, number>()
          });
        }

        const periodStats = periodStatsMap.get(period);
        periodStats.cancelledEnterpriseCount++;
        periodStats.totalCount++;

        // 统计状态原因
        const reason = record.churnReason || '企业状态正常';
        const reasonCount = periodStats.statusReasons.get(reason) || 0;
        periodStats.statusReasons.set(reason, reasonCount + 1);
      });

      // 统计 lost 业务状态记录
      lostBusinessRecords.forEach(record => {
        let period: string;
        const changeDate = new Date(record.churnDate);
        
        // 根据传入的参数决定统计维度
        if (query.year && !query.month) {
          // 只传year，按年统计
          period = changeDate.getFullYear().toString();
        } else {
          // 其他情况都按月统计
          period = changeDate.toISOString().substring(0, 7); // YYYY-MM
        }

        if (!periodStatsMap.has(period)) {
          periodStatsMap.set(period, {
            period,
            cancelledEnterpriseCount: 0,
            lostBusinessCount: 0,
            totalCount: 0,
            statusReasons: new Map<string, number>()
          });
        }

        const periodStats = periodStatsMap.get(period);
        periodStats.lostBusinessCount++;
        periodStats.totalCount++;

        // 统计状态原因
        const reason = record.churnReason || '业务状态流失';
        const reasonCount = periodStats.statusReasons.get(reason) || 0;
        periodStats.statusReasons.set(reason, reasonCount + 1);
      });

      // 转换为最终格式
      const churnStatsList = Array.from(periodStatsMap.values()).map(stats => ({
        period: stats.period,
        churnCount: stats.totalCount,
        cancelledEnterpriseCount: stats.cancelledEnterpriseCount,
        lostBusinessCount: stats.lostBusinessCount,
        churnRate: 0, // 这里需要总客户数来计算，暂时设为0
        churnReasons: Array.from(stats.statusReasons.entries()).map(([reason, count]) => ({
          reason,
          count
        }))
      }));

      // 应用排序到流失统计
      const validSortField = this.validateSortField('customerChurnStats', query.sortField);
      const churnStats = this.applySortToArray(churnStatsList, validSortField, query.sortOrder);

      // 客户详情
      const churnedCustomerList = statusResults.map(record => ({
        customerId: record.customerId,
        companyName: record.companyName,
        unifiedSocialCreditCode: record.unifiedSocialCreditCode,
        churnDate: DateUtils.formatDateTime(new Date(record.churnDate)),
        churnReason: record.churnReason,
        lastServiceDate: DateUtils.formatDateTime(new Date(record.churnDate)), // 简化处理，使用变更日期
        currentEnterpriseStatus: record.currentEnterpriseStatus,
        currentBusinessStatus: record.currentBusinessStatus,
      }));

      // 应用排序到客户详情
              const churnedCustomerItems = this.applySortToArray(churnedCustomerList, validSortField, query.sortOrder);

      // 应用分页到流失统计
      const total = churnStats.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedChurnStats = churnStats.slice(offset, offset + pageSize);

      const result: CustomerChurnStatsResponse = {
        list: paginatedChurnStats,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        churnedCustomers: churnedCustomerItems,
        summary: {
          totalChurned: statusResults.length,
          cancelledEnterpriseCount: cancelledEnterpriseRecords.length,
          lostBusinessCount: lostBusinessRecords.length,
          churnRate: 0, // 需要总客户数来计算
          recoveryOpportunities: lostBusinessRecords.filter(r => 
            r.currentEnterpriseStatus === 'cancelled'
          ).length,
        },
      };

      // 缓存结果（2小时，与客户等级分布统计保持一致）
      await this.cacheService.setCache(
        'customer_churn_stats',
        cacheKey,
        result,
        7200,
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
      const expiredCustomerList = rawResults.filter(item => {
        const endYear = parseInt(item.endYear);
        const endMonth = parseInt(item.endMonth);
        
        // 当前年月大于代理结束年月，则为到期客户
        return currentYear > endYear || (currentYear === endYear && currentMonth > endMonth);
      }).map(item => ({
        customerId: parseInt(item.customerId),
        agencyEndDate: item.agencyEndDate,
      }));

      // 应用排序
      const validSortField = this.validateSortField('serviceExpiryStats', query.sortField);
      const expiredCustomers = this.applySortToArray(expiredCustomerList, validSortField, query.sortOrder);

      // 应用分页
      const total = expiredCustomers.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedCustomers = expiredCustomers.slice(offset, offset + pageSize);

      const result: ServiceExpiryStatsResponse = {
        list: paginatedCustomers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          totalExpiredCustomers: expiredCustomers.length,
          expiringInMonth: 0, // 可以根据需要添加逻辑
          overdue: expiredCustomers.length,
        },
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

      // 应用排序
      const validSortField = this.validateSortField('accountantClientStats', query.sortField);
      const sortedAccountants = this.applySortToArray(accountants, validSortField, query.sortOrder);

      // 应用分页
      const total = sortedAccountants.length;
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const paginatedAccountants = sortedAccountants.slice(offset, offset + pageSize);

      const result: AccountantClientStatsResponse = {
        list: paginatedAccountants,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          totalAccountants: sortedAccountants.length,
          totalClients: sortedAccountants.reduce((sum, acc) => sum + acc.clientCount, 0),
          averageClientsPerAccountant: sortedAccountants.length > 0 
            ? sortedAccountants.reduce((sum, acc) => sum + acc.clientCount, 0) / sortedAccountants.length 
            : 0,
          topPerformer: {
            name: sortedAccountants.length > 0 
              ? sortedAccountants.reduce((max, acc) => acc.clientCount > max.clientCount ? acc : max).accountantName
              : '',
            clientCount: sortedAccountants.length > 0 
              ? sortedAccountants.reduce((max, acc) => acc.clientCount > max.clientCount ? acc : max).clientCount
              : 0,
          },
        },
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
   * 使用历史数据查询客户等级分布
   */
  private async getCustomerLevelDistributionWithHistory(
    query: CustomerLevelDistributionDto,
    customerFilter: (queryBuilder: SelectQueryBuilder<Customer>) => Promise<void> | void,
    timeFilter: { condition: string | null; parameters: any }
  ): Promise<any[]> {
    try {
      // 确定目标日期
      const targetDate = this.getTargetDate(query.year, query.month);
      
      // 获取符合条件的客户列表
      const customerQueryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .select(['customer.id', 'customer.contributionAmount'])
        .where('customer.enterpriseStatus != :status', { status: '已注销' })
        .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' });

      // 应用时间过滤（基于客户创建时间）
      if (timeFilter.condition) {
        customerQueryBuilder.andWhere(timeFilter.condition, timeFilter.parameters);
      }

      // 应用权限过滤
      await customerFilter(customerQueryBuilder);

      const customers = await customerQueryBuilder.getMany();
      
      if (customers.length === 0) {
        return [];
      }

      // 批量获取客户在目标时间点的等级
      const customerIds = customers.map(c => c.id);
      const levelMap = await this.levelHistoryService.batchGetCustomerLevelAtTime(
        customerIds,
        targetDate
      );

      // 统计等级分布
      const levelStats = new Map<string, { count: number; revenue: number }>();
      
      customers.forEach(customer => {
        const level = levelMap.get(customer.id) || 'Unknown';
        const revenue = customer.contributionAmount || 0;
        
        if (levelStats.has(level)) {
          const stats = levelStats.get(level)!;
          stats.count += 1;
          stats.revenue += revenue;
        } else {
          levelStats.set(level, { count: 1, revenue });
        }
      });

      // 转换为查询结果格式
      const results = Array.from(levelStats.entries()).map(([level, stats]) => ({
        level,
        count: stats.count.toString(),
        revenue: stats.revenue.toString()
      }));

      // 按数量降序排序
      results.sort((a, b) => parseInt(b.count) - parseInt(a.count));

      return results;
    } catch (error) {
      this.logger.error(`使用历史数据查询客户等级分布失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取目标日期
   */
  private getTargetDate(year?: number, month?: number): Date {
    const now = new Date();
    let targetYear = year || now.getFullYear();
    let targetMonth = month || (now.getMonth() + 1);

    if (month) {
      // 如果指定了月份，使用月末日期
      return new Date(targetYear, targetMonth, 0); // 0表示上个月的最后一天，即当月最后一天
    } else {
      // 如果只指定年份，使用年末日期
      return new Date(targetYear, 11, 31); // 12月31日
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

  /**
   * 使用历史数据获取指定等级的客户详情
   */
  private async getCustomerDetailsByLevelWithHistory(
    targetLevel: string,
    query: CustomerLevelDistributionDto,
    customerFilter: (queryBuilder: SelectQueryBuilder<Customer>) => Promise<void> | void,
    timeFilter: { condition: string | null; parameters: any }
  ): Promise<Array<{
    customerId: number;
    companyName: string;
    unifiedSocialCreditCode: string;
    contributionAmount: number;
  }>> {
    try {
      // 确定目标日期
      const targetDate = this.getTargetDate(query.year, query.month);
      
      // 获取符合条件的客户列表（包含详细信息）
      const customerQueryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .select([
          'customer.id',
          'customer.companyName',
          'customer.unifiedSocialCreditCode',
          'customer.contributionAmount'
        ])
        .where('customer.enterpriseStatus != :status', { status: '已注销' })
        .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' });

      // 应用时间过滤（基于客户创建时间）
      if (timeFilter.condition) {
        customerQueryBuilder.andWhere(timeFilter.condition, timeFilter.parameters);
      }

      // 应用权限过滤
      await customerFilter(customerQueryBuilder);

      const customers = await customerQueryBuilder.getMany();
      
      if (customers.length === 0) {
        return [];
      }

      // 批量获取客户在目标时间点的等级
      const customerIds = customers.map(c => c.id);
      const levelMap = await this.levelHistoryService.batchGetCustomerLevelAtTime(
        customerIds,
        targetDate
      );

      // 筛选出指定等级的客户并按贡献金额排序
      const targetLevelCustomers = customers
        .filter(customer => {
          const level = levelMap.get(customer.id) || 'Unknown';
          return level === targetLevel;
        })
        .sort((a, b) => (b.contributionAmount || 0) - (a.contributionAmount || 0))
        .slice(0, 10) // 只取前10个客户
        .map(customer => ({
          customerId: customer.id,
          companyName: customer.companyName,
          unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
          contributionAmount: customer.contributionAmount || 0,
        }));

      return targetLevelCustomers;
    } catch (error) {
      this.logger.error(`使用历史数据获取客户详情失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 获取历史数据查询的目标日期
   * 根据参数确定查询的截止日期
   */
  private getTargetDateForHistory(year?: number, month?: number): Date {
    const now = new Date();
    
    if (!year && !month) {
      // 不传参默认是当前日期
      return now;
    } else if (year && !month) {
      // 只传参year，则筛选参数当年最后一天之前的数据
      return new Date(year, 11, 31, 23, 59, 59, 999); // 12月31日最后一刻
    } else if (year && month) {
      // 传参year和month，则筛选参数年月的最后一天之前的数据
      return new Date(year, month, 0, 23, 59, 59, 999); // 当月最后一天的最后一刻
    } else {
      // 其他情况默认当前时间
      return now;
    }
  }

  /**
   * 基于 customer_status_history 表统计流失情况
   * 修改逻辑：统计每个公司在目标日期之前的最新状态记录中，
   * currentEnterpriseStatus为cancelled或currentBusinessStatus为lost的记录
   */
  private async getCustomerChurnStatsFromHistory(
    targetDate: Date,
    customerFilter: (queryBuilder: SelectQueryBuilder<Customer>) => Promise<void> | void
  ): Promise<any[]> {
    try {
      this.logger.warn(`开始从状态历史表统计流失情况，目标日期: ${targetDate.toISOString()}`);

      // 使用子查询找出每个公司在目标日期之前的最新状态记录
      const subQuery = this.customerStatusHistoryRepository
        .createQueryBuilder('csh_sub')
        .select([
          'csh_sub.companyName as companyName',
          'MAX(csh_sub.changeDate) as maxChangeDate'
        ])
        .where('csh_sub.changeDate <= :targetDate', { targetDate })
        .groupBy('csh_sub.companyName');

      // 主查询：获取每个公司的最新状态记录
      const queryBuilder = this.customerStatusHistoryRepository
        .createQueryBuilder('csh')
        .select([
          'csh.customerId as customerId',
          'csh.companyName as companyName', 
          'csh.unifiedSocialCreditCode as unifiedSocialCreditCode',
          'csh.currentEnterpriseStatus as currentEnterpriseStatus',
          'csh.currentBusinessStatus as currentBusinessStatus',
          'csh.changeDate as churnDate',
          'csh.changeReason as churnReason'
        ])
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'latest',
          'latest.companyName = csh.companyName AND latest.maxChangeDate = csh.changeDate'
        )
        .where('csh.changeDate <= :targetDate', { targetDate })
        .andWhere('(csh.currentEnterpriseStatus = :cancelled OR csh.currentBusinessStatus = :lost)', {
          cancelled: 'cancelled',
          lost: 'lost'
        });

      // 设置子查询的参数
      queryBuilder.setParameters(subQuery.getParameters());

      // 获取历史记录
      const historyRecords = await queryBuilder.getRawMany();
      
      this.logger.warn(`从状态历史表查询到 ${historyRecords.length} 条符合条件的记录`);

      if (historyRecords.length === 0) {
        return [];
      }

      // 获取这些客户的详细信息（用于权限过滤）
      const customerIds = historyRecords.map(record => parseInt(record.customerId)).filter(id => !isNaN(id));
      
      if (customerIds.length === 0) {
        return [];
      }

      // 应用权限过滤
      const customerQueryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.id IN (:...ids)', { ids: customerIds });

      await customerFilter(customerQueryBuilder);
      const allowedCustomers = await customerQueryBuilder.getMany();
      const allowedCustomerIds = new Set(allowedCustomers.map(c => c.id));

      // 过滤出用户有权限查看的记录
      const filteredRecords = historyRecords.filter(record => 
        allowedCustomerIds.has(parseInt(record.customerId))
      );

      this.logger.warn(`权限过滤后剩余 ${filteredRecords.length} 条记录`);

      // 转换数据格式
      return filteredRecords.map(record => ({
        customerId: parseInt(record.customerId),
        companyName: record.companyName,
        unifiedSocialCreditCode: record.unifiedSocialCreditCode,
        currentEnterpriseStatus: record.currentEnterpriseStatus,
        currentBusinessStatus: record.currentBusinessStatus,
        churnDate: record.churnDate instanceof Date ? 
          DateUtils.formatDateTime(record.churnDate) : 
          DateUtils.formatDateTime(new Date(record.churnDate)),
        churnReason: this.getChurnReasonText(record.currentEnterpriseStatus, record.currentBusinessStatus, record.churnReason)
      }));

    } catch (error) {
      this.logger.error(`从状态历史表统计流失情况失败: ${error.message}`, error.stack);
      // 如果历史表查询失败，回退到当前表查询
      return await this.getCustomerChurnStatsFromCurrentTable(targetDate, customerFilter);
    }
  }

  /**
   * 回退方案：从当前客户表统计流失情况
   */
  private async getCustomerChurnStatsFromCurrentTable(
    targetDate: Date,
    customerFilter: (queryBuilder: SelectQueryBuilder<Customer>) => Promise<void> | void
  ): Promise<any[]> {
    this.logger.warn('使用当前客户表作为流失统计的回退方案');

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .where('(customer.enterpriseStatus = :cancelled OR customer.businessStatus = :lost)', {
        cancelled: 'cancelled',
        lost: 'lost'
      })
      .andWhere('customer.updateTime <= :targetDate', { targetDate });

    await customerFilter(queryBuilder);
    const churnedCustomers = await queryBuilder.getMany();

    return churnedCustomers.map(customer => ({
      customerId: customer.id,
      companyName: customer.companyName,
      unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
      currentEnterpriseStatus: customer.enterpriseStatus,
      currentBusinessStatus: customer.businessStatus,
      churnDate: customer.updateTime ? 
        DateUtils.formatDateTime(customer.updateTime) : 
        DateUtils.formatDateTime(targetDate),
      churnReason: this.getChurnReasonText(customer.enterpriseStatus, customer.businessStatus)
    }));
  }

  /**
   * 根据状态获取流失原因文本
   */
  private getChurnReasonText(enterpriseStatus: string, businessStatus: string, originalReason?: string): string {
    if (originalReason && originalReason.trim()) {
      return originalReason;
    }

    if (enterpriseStatus === 'cancelled') {
      return '工商注销';
    } else if (businessStatus === 'lost') {
      return '业务流失';
    } else {
      return '未知原因';
    }
  }

  /**
   * 基于 customer_level_history 表统计等级分布
   */
  private async getCustomerLevelDistributionFromHistory(
    targetDate: Date,
    customerFilter: (queryBuilder: SelectQueryBuilder<Customer>) => Promise<void> | void
  ): Promise<any[]> {
    try {
      this.logger.warn(`开始从历史表统计等级分布，目标日期: ${targetDate.toISOString()}`);

      // 使用子查询找出每个公司在目标日期之前的最新等级记录
      const subQuery = this.customerLevelHistoryRepository
        .createQueryBuilder('clh_sub')
        .select([
          'clh_sub.companyName as companyName',
          'MAX(clh_sub.changeDate) as maxChangeDate'
        ])
        .where('clh_sub.changeDate <= :targetDate', { targetDate })
        .groupBy('clh_sub.companyName');

      // 主查询：获取每个公司的最新等级记录
      const queryBuilder = this.customerLevelHistoryRepository
        .createQueryBuilder('clh')
        .select([
          'clh.customerId as customerId',
          'clh.companyName as companyName', 
          'clh.unifiedSocialCreditCode as unifiedSocialCreditCode',
          'clh.currentLevel as level'
        ])
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'latest',
          'latest.companyName = clh.companyName AND latest.maxChangeDate = clh.changeDate'
        )
        .where('clh.changeDate <= :targetDate', { targetDate });

      // 设置子查询的参数
      queryBuilder.setParameters(subQuery.getParameters());

      // 获取历史记录
      const historyRecords = await queryBuilder.getRawMany();
      
      this.logger.warn(`从历史表查询到 ${historyRecords.length} 条记录`);

      if (historyRecords.length === 0) {
        return [];
      }

      // 获取这些客户的详细信息（包括贡献金额）
      const customerIds = historyRecords.map(record => parseInt(record.customerId)).filter(id => !isNaN(id));
      
      if (customerIds.length === 0) {
        return [];
      }

      // 构建客户查询，应用权限过滤
      const customerQueryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .select([
          'customer.id',
          'customer.contributionAmount'
        ])
        .where('customer.id IN (:...customerIds)', { customerIds })
        .andWhere('customer.enterpriseStatus != :status', { status: '已注销' })
        .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' });

      // 应用权限过滤
      await customerFilter(customerQueryBuilder);

      const customers = await customerQueryBuilder.getMany();
      
      // 创建客户ID到贡献金额的映射
      const customerContributionMap = new Map<number, number>();
      customers.forEach(customer => {
        customerContributionMap.set(customer.id, customer.contributionAmount || 0);
      });

      // 过滤出有权限查看的历史记录
      const authorizedRecords = historyRecords.filter(record => 
        customerContributionMap.has(parseInt(record.customerId))
      );

      // 按等级统计
      const levelStats = new Map<string, { count: number; revenue: number }>();
      
      authorizedRecords.forEach(record => {
        const level = this.cleanCustomerLevel(record.level) || '未分级';
        const customerId = parseInt(record.customerId);
        const revenue = customerContributionMap.get(customerId) || 0;
        
        if (levelStats.has(level)) {
          const stats = levelStats.get(level)!;
          stats.count += 1;
          stats.revenue += revenue;
        } else {
          levelStats.set(level, { count: 1, revenue });
        }
      });

      // 转换为查询结果格式
      const results = Array.from(levelStats.entries()).map(([level, stats]) => ({
        level,
        count: stats.count.toString(),
        revenue: stats.revenue.toString()
      }));

      // 按数量降序排序
      results.sort((a, b) => parseInt(b.count) - parseInt(a.count));

      this.logger.warn(`等级分布统计完成，共 ${results.length} 个等级`);
      return results;
    } catch (error) {
      this.logger.error(`从历史表统计等级分布失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 基于历史表获取指定等级的客户详情
   */
  private async getCustomerDetailsByLevelFromHistory(
    targetLevel: string,
    targetDate: Date,
    customerFilter: (queryBuilder: SelectQueryBuilder<Customer>) => Promise<void> | void
  ): Promise<Array<{
    customerId: number;
    companyName: string;
    unifiedSocialCreditCode: string;
    contributionAmount: number;
  }>> {
    try {
      this.logger.warn(`获取等级 ${targetLevel} 的客户详情，目标日期: ${targetDate.toISOString()}`);

      // 使用子查询找出每个公司在目标日期之前的最新等级记录
      const subQuery = this.customerLevelHistoryRepository
        .createQueryBuilder('clh_sub')
        .select([
          'clh_sub.companyName as companyName',
          'MAX(clh_sub.changeDate) as maxChangeDate'
        ])
        .where('clh_sub.changeDate <= :targetDate', { targetDate })
        .groupBy('clh_sub.companyName');

      // 主查询：获取指定等级的客户记录
      const queryBuilder = this.customerLevelHistoryRepository
        .createQueryBuilder('clh')
        .select([
          'clh.customerId as customerId',
          'clh.companyName as companyName',
          'clh.unifiedSocialCreditCode as unifiedSocialCreditCode',
          'clh.currentLevel as level'
        ])
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'latest',
          'latest.companyName = clh.companyName AND latest.maxChangeDate = clh.changeDate'
        )
        .where('clh.changeDate <= :targetDate', { targetDate })
        .andWhere('TRIM(clh.currentLevel) = :targetLevel', { targetLevel });

      // 设置子查询的参数
      queryBuilder.setParameters(subQuery.getParameters());

      // 获取历史记录
      const historyRecords = await queryBuilder.getRawMany();
      
      if (historyRecords.length === 0) {
        return [];
      }

      // 获取这些客户的详细信息
      const customerIds = historyRecords.map(record => parseInt(record.customerId)).filter(id => !isNaN(id));
      
      if (customerIds.length === 0) {
        return [];
      }

      // 构建客户查询，应用权限过滤
      const customerQueryBuilder = this.customerRepository
        .createQueryBuilder('customer')
        .select([
          'customer.id',
          'customer.companyName',
          'customer.unifiedSocialCreditCode',
          'customer.contributionAmount'
        ])
        .where('customer.id IN (:...customerIds)', { customerIds })
        .andWhere('customer.enterpriseStatus != :status', { status: '已注销' })
        .andWhere('customer.businessStatus != :businessStatus', { businessStatus: '已流失' })
        .orderBy('customer.contributionAmount', 'DESC')
        .limit(10); // 只取前10个客户

      // 应用权限过滤
      await customerFilter(customerQueryBuilder);

      const customers = await customerQueryBuilder.getMany();
      
      // 转换为返回格式
      const result = customers.map(customer => ({
        customerId: customer.id,
        companyName: customer.companyName,
        unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
        contributionAmount: customer.contributionAmount || 0,
      }));

      this.logger.warn(`等级 ${targetLevel} 的客户详情查询完成，返回 ${result.length} 条记录`);
      return result;
    } catch (error) {
      this.logger.error(`获取等级客户详情失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 清理客户等级字符串，去除前后空格并处理空值
   * @param level 原始等级字符串
   * @returns 清理后的等级字符串
   */
  private cleanCustomerLevel(level: string | null | undefined): string | null {
    if (!level) {
      return null;
    }
    
    // 去除前后空格
    const trimmed = level.trim();
    
    // 如果清理后为空字符串，返回 null
    if (trimmed === '') {
      return null;
    }
    
    return trimmed;
  }

  /**
   * 定义每个报表接口允许排序的字段白名单
   */
  private readonly SORTABLE_FIELDS = {
    agencyFeeAnalysis: ['companyName', 'decreaseAmount', 'currentYearFee', 'previousYearFee', 'decreasePercentage'],
    newCustomerStats: ['customerId'],
    employeePerformance: ['totalRevenue', 'newCustomerRevenue', 'renewalRevenue', 'customerCount', 'otherRevenue'],
    customerLevelDistribution: ['level', 'count', 'percentage', 'revenue'],
    customerChurnStats: ['period', 'churnCount', 'churnRate', 'churnDate'],
    serviceExpiryStats: ['customerId', 'agencyEndDate'],
    accountantClientStats: ['clientCount']
  };

  /**
   * 验证排序字段是否在白名单中
   * @param reportType 报表类型
   * @param sortField 排序字段
   */
  private validateSortField(reportType: keyof typeof this.SORTABLE_FIELDS, sortField?: string): string | null {
    if (!sortField) {
      return null;
    }

    const allowedFields = this.SORTABLE_FIELDS[reportType];
    if (!allowedFields.includes(sortField)) {
      this.logger.warn(`非法排序字段: ${sortField}, 允许的字段: ${allowedFields.join(', ')}`);
      return null;
    }

    return sortField;
  }
} 