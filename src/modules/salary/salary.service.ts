import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Like, DataSource } from 'typeorm';
import { Salary } from './entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { QuerySalaryDto } from './dto/query-salary.dto';
import { ConfirmSalaryDto } from './dto/confirm-salary.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { SalaryPermissionService } from './services/salary-permission.service';
import { User } from '../users/entities/user.entity';
import { Employee } from '../employee/entities/employee.entity';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly salaryPermissionService: SalaryPermissionService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSalaryDto: CreateSalaryDto, userId: number): Promise<Salary> {
    // 检查权限
    const hasPermission = await this.salaryPermissionService.hasSalaryCreatePermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有创建薪资记录的权限');
    }

    // 先计算所有衍生字段
    const salaryWithDerivedFields = this.calculateDerivedFields(createSalaryDto);
    const salary = this.salaryRepository.create(salaryWithDerivedFields);
    return this.salaryRepository.save(salary);
  }

  // 添加批量创建薪资记录的方法
  async createBatch(createSalaryDtos: CreateSalaryDto[], userId: number): Promise<{ success: boolean; message: string; count: number }> {
    // 检查权限
    const hasPermission = await this.salaryPermissionService.hasSalaryCreatePermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有创建薪资记录的权限');
    }
    
    const salaries = createSalaryDtos.map(dto => {
      const withDerivedFields = this.calculateDerivedFields(dto);
      return this.salaryRepository.create(withDerivedFields);
    });
    const savedResults = await this.salaryRepository.save(salaries);
    return { 
      success: true, 
      message: '批量创建薪资记录成功',
      count: savedResults.length 
    };
  }

  /**
   * 计算薪资衍生字段
   * 根据业务规则自动计算basicSalaryPayable、totalPayable、corporatePayment和taxDeclaration
   */
  private calculateDerivedFields<T extends Partial<Salary> & { skipPerformanceCalculation?: boolean }>(salaryData: T): T {
    const result = { ...salaryData };
    
    // 基本字段值处理，确保是数字
    const baseSalary = Number(result.baseSalary || 0);
    const temporaryIncrease = Number(result.temporaryIncrease || 0);
    const attendanceDeduction = Number(result.attendanceDeduction || 0);
    const fullAttendance = Number(result.fullAttendance || 0);
    const totalSubsidy = Number(result.totalSubsidy || 0);
    const seniority = Number(result.seniority || 0);
    const agencyFeeCommission = Number(result.agencyFeeCommission || 0);
    const businessCommission = Number(result.businessCommission || 0);
    const otherDeductions = Number(result.otherDeductions || 0);
    const personalInsuranceTotal = Number(result.personalInsuranceTotal || 0);
    const depositDeduction = Number(result.depositDeduction || 0);
    const personalIncomeTax = Number(result.personalIncomeTax || 0);
    const other = Number(result.other || 0);
    const bankCardOrWechat = Number(result.bankCardOrWechat || 0);
    const cashPaid = Number(result.cashPaid || 0);
    
    // 计算绩效佣金，如果有标记则跳过
    if (!result.skipPerformanceCalculation) {
      // 计算绩效扣除总额
      let performanceDeductionTotal = 0;
      if (result.performanceDeductions && Array.isArray(result.performanceDeductions)) {
        performanceDeductionTotal = result.performanceDeductions.reduce((sum, deduction) => sum + Number(deduction || 0), 0);
        
        // 如果绩效扣除总额大于1，则重置为1
        if (performanceDeductionTotal > 1) {
          performanceDeductionTotal = 1;
        }
      }
      
      // 计算绩效佣金 = 原始绩效佣金 * (1 - 绩效扣除总额)
      const originalPerformanceCommission = Number(result.performanceCommission || 0);
      result.performanceCommission = originalPerformanceCommission * (1 - performanceDeductionTotal);
    }
    
    // 计算应发基本工资
    const basicSalaryPayable = baseSalary + temporaryIncrease - attendanceDeduction;
    result.basicSalaryPayable = basicSalaryPayable;
    
    // 计算应发合计
    const totalPayable = basicSalaryPayable + 
      fullAttendance + 
      totalSubsidy + 
      seniority + 
      agencyFeeCommission + 
      Number(result.performanceCommission || 0) + 
      businessCommission - 
      otherDeductions - 
      personalInsuranceTotal - 
      depositDeduction - 
      personalIncomeTax - 
      other;
    result.totalPayable = totalPayable;
    
    // 计算对公金额
    const corporatePayment = totalPayable - bankCardOrWechat - cashPaid;
    result.corporatePayment = corporatePayment;
    
    // 计算个税申报
    result.taxDeclaration = corporatePayment + personalInsuranceTotal;
    
    // 删除临时标记字段
    delete result.skipPerformanceCalculation;
    
    return result;
  }

  /**
   * 为薪资数据添加发工资公司信息
   * @param salaries 薪资数据数组
   * @returns 附加发工资公司信息的薪资数据
   */
  private async addPayrollCompanyToSalaries<T extends Salary>(salaries: T[]): Promise<(T & { payrollCompany?: string })[]> {
    if (!salaries || salaries.length === 0) {
      return salaries;
    }

    // 提取所有姓名和身份证号
    const employeeKeys = salaries.map(salary => ({
      name: salary.name,
      idCard: salary.idCard
    }));

    // 批量查询员工信息
    const employees = await this.employeeRepository.find({
      select: ['name', 'idCardNumber', 'payrollCompany'],
    });

    // 创建员工信息映射（优先根据身份证号匹配，其次根据姓名匹配）
    const employeeMap = new Map<string, string>();
    
    employees.forEach(employee => {
      if (employee.idCardNumber) {
        employeeMap.set(`id:${employee.idCardNumber}`, employee.payrollCompany || '');
      }
      if (employee.name) {
        employeeMap.set(`name:${employee.name}`, employee.payrollCompany || '');
      }
    });

    // 为每个薪资记录添加发工资公司信息
    return salaries.map(salary => ({
      ...salary,
      payrollCompany: employeeMap.get(`id:${salary.idCard}`) || 
                     employeeMap.get(`name:${salary.name}`) || 
                     ''
    }));
  }

  /**
   * 为单个薪资数据添加发工资公司信息
   * @param salary 薪资数据
   * @returns 附加发工资公司信息的薪资数据
   */
  private async addPayrollCompanyToSalary<T extends Salary>(salary: T): Promise<T & { payrollCompany?: string }> {
    if (!salary) {
      return salary;
    }

    // 查询员工信息（优先根据身份证号查询，其次根据姓名查询）
    let employee = null;
    
    if (salary.idCard) {
      employee = await this.employeeRepository.findOne({
        where: { idCardNumber: salary.idCard },
        select: ['payrollCompany']
      });
    }
    
    if (!employee && salary.name) {
      employee = await this.employeeRepository.findOne({
        where: { name: salary.name },
        select: ['payrollCompany']
      });
    }

    return {
      ...salary,
      payrollCompany: employee?.payrollCompany || ''
    };
  }

  /**
   * 获取员工保证金总额
   * @param name 员工姓名
   * @returns 保证金总额
   */
  async getEmployeeDepositTotal(name: string): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) as totalDeposit 
         FROM sys_deposit 
         WHERE name = ?`,
        [name]
      );
      
      return Number(result[0]?.totalDeposit || 0);
    } catch (error) {
      console.error(`获取员工${name}的保证金总额失败:`, error);
      return 0;
    }
  }

  /**
   * 批量获取员工保证金总额
   * @param names 员工姓名数组
   * @returns 姓名到保证金总额的映射
   */
  async getMultipleEmployeeDepositTotals(names: string[]): Promise<Map<string, number>> {
    const depositMap = new Map<string, number>();
    
    if (!names || names.length === 0) {
      return depositMap;
    }
    
    try {
      // 为SQL查询准备参数占位符
      const placeholders = names.map(() => '?').join(',');
      
      const result = await this.dataSource.query(
        `SELECT name, COALESCE(SUM(amount), 0) as totalDeposit 
         FROM sys_deposit 
         WHERE name IN (${placeholders})
         GROUP BY name`,
        [...names]
      );
      
      // 将结果转换为Map
      result.forEach(item => {
        depositMap.set(item.name, Number(item.totalDeposit || 0));
      });
      
      // 确保所有请求的名字都有一个条目，即使是0
      names.forEach(name => {
        if (!depositMap.has(name)) {
          depositMap.set(name, 0);
        }
      });
      
      return depositMap;
    } catch (error) {
      console.error('批量获取员工保证金总额失败:', error);
      // 出错时返回所有为0的映射
      names.forEach(name => {
        depositMap.set(name, 0);
      });
      return depositMap;
    }
  }

  async findAll(query: QuerySalaryDto, userId: number) {
    console.log('薪资查询参数:', JSON.stringify(query));
    
    // 确保分页参数是有效的数字
    let { page = 1, pageSize = 10, department, name, idCard, type, isPaid, yearMonth, startDate, endDate } = query;
    
    // 使用安全的分页参数处理函数
    const { page: safePage, pageSize: safePageSize } = safePaginationParams(page, pageSize);
    page = safePage;
    pageSize = safePageSize;
    
    const queryBuilder = this.salaryRepository.createQueryBuilder('salary');
    
    // 获取权限过滤条件
    const filterConditions = await this.salaryPermissionService.buildSalaryQueryFilter(userId);
    
    // 应用权限过滤条件
    if (Array.isArray(filterConditions)) {
      // 如果是条件数组，使用OR连接
      const whereConditions = [];
      
      for (const condition of filterConditions) {
        if (condition.notDepartment) {
          // 处理特殊条件：非分公司
          whereConditions.push("salary.department NOT LIKE '%分公司'");
        } else if (Object.keys(condition).length > 0) {
          // 处理普通条件
          const subConditions = [];
          for (const key in condition) {
            subConditions.push(`salary.${key} = :${key}${whereConditions.length}`);
            queryBuilder.setParameter(`${key}${whereConditions.length}`, condition[key]);
          }
          if (subConditions.length > 0) {
            whereConditions.push(`(${subConditions.join(' AND ')})`);
          }
        } else {
          // 空对象表示无限制（查看所有权限）
          whereConditions.push('1=1');
        }
      }
      
      if (whereConditions.length > 0) {
        queryBuilder.andWhere(`(${whereConditions.join(' OR ')})`);
      }
    } else if (filterConditions.notDepartment) {
      // 处理非分公司条件
      queryBuilder.andWhere("salary.department NOT LIKE '%分公司'");
    } else if (Object.keys(filterConditions).length > 0) {
      // 处理单一对象条件
      for (const key in filterConditions) {
        if (key !== 'notDepartment') {
          queryBuilder.andWhere(`salary.${key} = :${key}`, {
            [key]: filterConditions[key],
          });
        }
      }
    }
    
    // 应用其他查询条件
    if (department) {
      queryBuilder.andWhere('salary.department LIKE :department', { department: `%${department}%` });
    }
    
    if (name) {
      queryBuilder.andWhere('salary.name LIKE :name', { name: `%${name}%` });
    }
    
    if (idCard) {
      queryBuilder.andWhere('salary.idCard LIKE :idCard', { idCard: `%${idCard}%` });
    }
    
    if (type) {
      queryBuilder.andWhere('salary.type LIKE :type', { type: `%${type}%` });
    }
    
    // 注意：company字段已从数据库中删除，如果需要公司查询功能，请使用payrollCompany动态字段
    // if (company) {
    //   queryBuilder.andWhere('salary.company LIKE :company', { company: `%${company}%` });
    // }
    
    // 添加是否已发放的查询条件
    if (isPaid !== undefined) {
      queryBuilder.andWhere('salary.isPaid = :isPaid', { isPaid });
    }
    
    // 处理日期参数，避免NaN值
    try {
      // 安全处理yearMonth参数
      const safeYearMonth = safeDateParam(yearMonth);
      if (safeYearMonth) {
        queryBuilder.andWhere('salary.yearMonth = :yearMonth', { yearMonth: safeYearMonth });
        console.log('使用yearMonth参数:', safeYearMonth);
      }
      
      // 安全处理startDate和endDate参数
      const safeStartDate = safeDateParam(startDate);
      const safeEndDate = safeDateParam(endDate);
      
      if (safeStartDate && safeEndDate) {
        queryBuilder.andWhere('salary.yearMonth BETWEEN :startDate AND :endDate', { 
          startDate: safeStartDate, 
          endDate: safeEndDate 
        });
        console.log('使用日期范围:', safeStartDate, '至', safeEndDate);
      }
    } catch (error) {
      console.error('薪资日期参数处理错误:', error);
    }
    
    // 打印生成的SQL和参数
    const [query_sql, parameters] = queryBuilder.getQueryAndParameters();
    console.log('薪资生成的SQL:', query_sql);
    console.log('薪资SQL参数:', parameters);
    
    // 获取数据时使用try-catch包装，以防止排序或分页出现NaN问题
    let total = 0;
    let data = [];
    
    try {
      total = await queryBuilder.getCount();
      
      data = await queryBuilder
        .orderBy('salary.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();

      // 如果有数据，获取所有员工的保证金总和和发工资公司信息
      if (data.length > 0) {
        const employeeNames = data.map(item => item.name);
        const depositTotals = await this.getMultipleEmployeeDepositTotals(employeeNames);
        
        // 添加发工资公司信息
        const dataWithPayrollCompany = await this.addPayrollCompanyToSalaries(data);
        
        // 将保证金总和添加到每个薪资记录中
        data = dataWithPayrollCompany.map(item => ({
          ...item,
          depositTotal: depositTotals.get(item.name) || 0
        }));
      }
    } catch (error) {
      console.error('获取薪资数据出错:', error);
    }
    
    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number, userId: number): Promise<Salary & { depositTotal?: number; payrollCompany?: string }> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`无效的ID值: ${id}, 转换后: ${safeId}`);
      throw new NotFoundException(`无效的薪资记录ID: ${id}`);
    }
    
    // 获取薪资记录
    const salary = await this.salaryRepository.findOne({ where: { id: safeId } });
    
    if (!salary) {
      throw new NotFoundException(`ID为${id}的薪资记录不存在`);
    }
    
    // 获取用户权限过滤条件
    const filterConditions = await this.salaryPermissionService.buildSalaryQueryFilter(userId);
    
    // 检查用户是否有权限查看该记录
    if (Array.isArray(filterConditions)) {
      // 多个条件，任一条件满足即可
      let hasAccess = false;
      for (const condition of filterConditions) {
        if (this.checkAccess(salary, condition)) {
          hasAccess = true;
          break;
        }
      }
      
      if (!hasAccess) {
        throw new ForbiddenException('没有权限查看该薪资记录');
      }
    } else if (!this.checkAccess(salary, filterConditions)) {
      throw new ForbiddenException('没有权限查看该薪资记录');
    }
    
    // 获取员工保证金总和
    const depositTotal = await this.getEmployeeDepositTotal(salary.name);
    
    // 添加发工资公司信息
    const salaryWithPayrollCompany = await this.addPayrollCompanyToSalary(salary);
    
    // 返回附加了保证金总和和发工资公司信息的薪资记录
    return {
      ...salaryWithPayrollCompany,
      depositTotal
    };
  }

  async update(id: number, updateSalaryDto: UpdateSalaryDto, userId: number): Promise<Salary> {
    // 检查权限
    const hasPermission = await this.salaryPermissionService.hasSalaryEditPermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有编辑薪资记录的权限');
    }
    
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`更新时无效的ID值: ${id}, 转换后: ${safeId}`);
      throw new NotFoundException(`无效的薪资记录ID: ${id}`);
    }
    
    // 检查记录是否存在
    const existingSalary = await this.findOne(safeId, userId);
    if (!existingSalary) {
      throw new NotFoundException(`ID为${id}的薪资记录不存在`);
    }

    // 标记是否已经计算过绩效佣金
    let skipPerformanceCalculation = false;

    // 如果更新了performanceDeductions字段，确保重新计算performanceCommission
    if (updateSalaryDto.performanceDeductions) {
      // 如果没有提供performanceCommission，则使用现有值
      const originalPerformanceCommission = updateSalaryDto.performanceCommission !== undefined 
        ? Number(updateSalaryDto.performanceCommission) 
        : Number(existingSalary.performanceCommission);

      console.log(`更新前：原始绩效佣金=${originalPerformanceCommission}, 现有绩效佣金=${existingSalary.performanceCommission}`);
      
      // 计算绩效扣除总额
      let performanceDeductionTotal = 0;
      if (Array.isArray(updateSalaryDto.performanceDeductions)) {
        performanceDeductionTotal = updateSalaryDto.performanceDeductions.reduce(
          (sum, deduction) => sum + Number(deduction || 0), 0
        );
        
        // 如果绩效扣除总额大于1，则重置为1
        if (performanceDeductionTotal > 1) {
          performanceDeductionTotal = 1;
        }
      }
      
      // 重新计算绩效佣金 = 原始绩效佣金 * (1 - 绩效扣除总额)
      updateSalaryDto.performanceCommission = originalPerformanceCommission * (1 - performanceDeductionTotal);
      
      console.log(`更新薪资ID ${safeId}：重新计算绩效佣金，扣除总额=${performanceDeductionTotal}，原始绩效=${originalPerformanceCommission}，最终绩效=${updateSalaryDto.performanceCommission}`);
      
      // 标记已经计算过绩效佣金，避免重复计算
      skipPerformanceCalculation = true;
    }
    
    // 将现有值与更新值合并，确保calculateDerivedFields有完整的数据
    // 注意：从existingSalary中移除非实体字段（depositTotal和payrollCompany）
    const { depositTotal, payrollCompany, ...salaryWithoutComputedFields } = existingSalary;
    
    const mergedData = {
      ...salaryWithoutComputedFields,
      ...updateSalaryDto,
      // 添加标记避免重复计算绩效佣金
      skipPerformanceCalculation
    };
    
    // 计算衍生字段
    const dataWithDerivedFields = this.calculateDerivedFields(mergedData);
    
    // 执行更新操作
    await this.salaryRepository.update(safeId, dataWithDerivedFields);
    return this.findOne(safeId, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    // 检查权限
    const hasPermission = await this.salaryPermissionService.hasSalaryDeletePermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有删除薪资记录的权限');
    }
    
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`删除时无效的ID值: ${id}, 转换后: ${safeId}`);
      throw new NotFoundException(`无效的薪资记录ID: ${id}`);
    }
    
    // 检查记录是否存在
    const existingSalary = await this.findOne(safeId, userId);
    if (!existingSalary) {
      throw new NotFoundException(`ID为${id}的薪资记录不存在`);
    }
    
    await this.salaryRepository.delete(safeId);
  }

  /**
   * 确认薪资记录
   * @param id 薪资记录ID
   * @param confirmSalaryDto 确认薪资DTO
   * @param userId 用户ID
   * @returns 更新后的薪资记录
   */
  async confirmSalary(id: number, confirmSalaryDto: ConfirmSalaryDto, userId: number): Promise<Salary> {
    // 注意：已移除管理员权限检查，所有登录用户都可以调用此接口
    // 但用户只能确认他们有权限查看的薪资记录（通过findOne方法的权限检查）
    
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`确认薪资时无效的ID值: ${id}, 转换后: ${safeId}`);
      throw new NotFoundException(`无效的薪资记录ID: ${id}`);
    }
    
    // 检查记录是否存在
    const existingSalary = await this.findOne(safeId, userId);
    if (!existingSalary) {
      throw new NotFoundException(`ID为${id}的薪资记录不存在`);
    }

    // 更新确认状态和确认时间
    const updateData = {
      isConfirmed: confirmSalaryDto.isConfirmed,
      confirmedAt: confirmSalaryDto.isConfirmed ? new Date() : null,
    };
    
    await this.salaryRepository.update(safeId, updateData);
    return this.findOne(safeId, userId);
  }
  
  // 员工查看自己的薪资列表
  async findMySalary(query: QuerySalaryDto, userId: number) {
    console.log('员工薪资查询参数:', JSON.stringify(query));
    
    // 确保分页参数是有效的数字
    let { page = 1, pageSize = 10, yearMonth, startDate, endDate } = query;
    
    // 使用安全的分页参数处理函数
    const { page: safePage, pageSize: safePageSize } = safePaginationParams(page, pageSize);
    page = safePage;
    pageSize = safePageSize;
    
    // 获取当前用户信息，通过身份证号关联薪资记录
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user || !user.idCardNumber) {
      throw new ForbiddenException('用户信息不完整，无法查询薪资记录。请联系管理员补充身份证号信息。');
    }
    
    const queryBuilder = this.salaryRepository.createQueryBuilder('salary');
    
    // 只能查看与自己身份证号匹配的薪资记录
    queryBuilder.andWhere('salary.idCard = :idCard', { idCard: user.idCardNumber });
    
    // 处理日期参数
    try {
      // 安全处理yearMonth参数
      const safeYearMonth = safeDateParam(yearMonth);
      if (safeYearMonth) {
        queryBuilder.andWhere('salary.yearMonth = :yearMonth', { yearMonth: safeYearMonth });
      }
      
      // 安全处理startDate和endDate参数
      const safeStartDate = safeDateParam(startDate);
      const safeEndDate = safeDateParam(endDate);
      
      if (safeStartDate && safeEndDate) {
        queryBuilder.andWhere('salary.yearMonth BETWEEN :startDate AND :endDate', { 
          startDate: safeStartDate, 
          endDate: safeEndDate 
        });
      }
    } catch (error) {
      console.error('员工薪资日期参数处理错误:', error);
    }
    
    // 获取数据
    let total = 0;
    let data = [];
    
    try {
      total = await queryBuilder.getCount();
      
      data = await queryBuilder
        .orderBy('salary.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();

      // 获取员工保证金总和和发工资公司信息
      if (data.length > 0) {
        const depositTotal = await this.getEmployeeDepositTotal(user.username || data[0].name);
        
        // 添加发工资公司信息
        const dataWithPayrollCompany = await this.addPayrollCompanyToSalaries(data);
        
        // 将保证金总和添加到每个薪资记录中
        data = dataWithPayrollCompany.map(item => ({
          ...item,
          depositTotal
        }));
      }
    } catch (error) {
      console.error('获取员工薪资列表出错:', error);
    }
    
    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  // 员工查看自己的薪资详情
  async findMySalaryById(id: number, userId: number): Promise<Salary & { depositTotal?: number; payrollCompany?: string }> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`无效的ID值: ${id}, 转换后: ${safeId}`);
      throw new NotFoundException(`无效的薪资记录ID: ${id}`);
    }
    
    // 获取当前用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user || !user.idCardNumber) {
      throw new ForbiddenException('用户信息不完整，无法查询薪资记录。请联系管理员补充身份证号信息。');
    }
    
    // 获取薪资记录，并验证是否属于当前用户
    const salary = await this.salaryRepository.findOne({ 
      where: { 
        id: safeId,
        idCard: user.idCardNumber 
      } 
    });
    
    if (!salary) {
      throw new NotFoundException(`薪资记录不存在或您无权查看该记录`);
    }
    
    // 获取员工保证金总和
    const depositTotal = await this.getEmployeeDepositTotal(salary.name);
    
    // 添加发工资公司信息
    const salaryWithPayrollCompany = await this.addPayrollCompanyToSalary(salary);
    
    // 返回附加了保证金总和和发工资公司信息的薪资记录
    return {
      ...salaryWithPayrollCompany,
      depositTotal
    };
  }
  
  // 检查薪资记录是否符合访问条件
  private checkAccess(salary: Salary, condition: any): boolean {
    // 空条件表示可以访问所有记录
    if (!condition || Object.keys(condition).length === 0) {
      return true;
    }
    
    // 特殊条件：非分公司
    if (condition.notDepartment) {
      return !salary.department || salary.department.length < 3 || 
             salary.department.substring(salary.department.length - 3) !== '分公司';
    }
    
    // 普通条件匹配
    for (const key in condition) {
      if (key !== 'notDepartment' && salary[key] !== condition[key]) {
        return false;
      }
    }
    
    return true;
  }
}
