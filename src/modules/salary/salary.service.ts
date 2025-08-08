import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Like, DataSource } from 'typeorm';
import { Salary } from './entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { QuerySalaryDto } from './dto/query-salary.dto';
import { ConfirmSalaryDto } from './dto/confirm-salary.dto';
import { ExportSalaryDto } from './dto/export-salary.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { SalaryPermissionService } from './services/salary-permission.service';
import { User } from '../users/entities/user.entity';
import { Employee } from '../employee/entities/employee.entity';
import { AttendanceDeduction } from './attendance-deduction/entities/attendance-deduction.entity';
import { Parser } from 'json2csv';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(AttendanceDeduction)
    private readonly attendanceDeductionRepository: Repository<AttendanceDeduction>,
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

  /**
   * 获取员工考勤备注
   * @param name 员工姓名
   * @param yearMonth 年月，格式为yyyy-mm-dd，只匹配年月部分
   * @returns 考勤备注
   */
  async getAttendanceRemark(name: string, yearMonth: string): Promise<string> {
    if (!name || !yearMonth) {
      return '';
    }
    
    try {
      // 提取年月部分（yyyy-mm）
      const yearMonthPrefix = yearMonth.substring(0, 7);
      
      const attendanceRecord = await this.attendanceDeductionRepository.findOne({
        where: {
          name: name,
        },
        order: {
          yearMonth: 'DESC'
        }
      });
      
      // 如果找到记录且年月匹配
      if (attendanceRecord && attendanceRecord.yearMonth) {
        const recordYearMonth = attendanceRecord.yearMonth instanceof Date
          ? attendanceRecord.yearMonth.toISOString().substring(0, 7)
          : String(attendanceRecord.yearMonth).substring(0, 7);
        if (recordYearMonth === yearMonthPrefix) {
          return attendanceRecord.remark || '';
        }
      }
      
      return '';
    } catch (error) {
      console.error(`获取员工${name}考勤备注失败:`, error);
      return '';
    }
  }

  /**
   * 批量获取员工考勤备注
   * @param salaries 薪资记录数组
   * @returns 薪资记录数组，每个记录添加了attendanceRemark字段
   */
  async addAttendanceRemarksToSalaries(salaries: any[]): Promise<any[]> {
    if (!salaries || salaries.length === 0) {
      return salaries;
    }
    
    try {
      // 获取所有的姓名和年月组合
      const nameYearMonthPairs = salaries.map(salary => ({
        name: salary.name,
        yearMonth: salary.yearMonth instanceof Date 
          ? salary.yearMonth.toISOString().split('T')[0] 
          : salary.yearMonth
      }));
      
      // 批量查询考勤备注
      const remarkPromises = nameYearMonthPairs.map(pair => 
        this.getAttendanceRemark(pair.name, pair.yearMonth)
      );
      
      const remarks = await Promise.all(remarkPromises);
      
      // 将备注添加到每个薪资记录中
      return salaries.map((salary, index) => ({
        ...salary,
        attendanceRemark: remarks[index]
      }));
    } catch (error) {
      console.error('批量获取考勤备注失败:', error);
      // 出错时返回原始数据，attendanceRemark为空字符串
      return salaries.map(salary => ({
        ...salary,
        attendanceRemark: ''
      }));
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
        
        // 添加考勤备注信息
        const dataWithAttendanceRemarks = await this.addAttendanceRemarksToSalaries(dataWithPayrollCompany);
        
        // 将保证金总和添加到每个薪资记录中
        data = dataWithAttendanceRemarks.map(item => ({
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

  async findOne(id: number, userId: number): Promise<Salary & { depositTotal?: number; payrollCompany?: string; attendanceRemark?: string }> {
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
    
    // 获取考勤备注信息
    const yearMonthStr = salary.yearMonth instanceof Date 
      ? salary.yearMonth.toISOString().split('T')[0] 
      : salary.yearMonth;
    const attendanceRemark = await this.getAttendanceRemark(salary.name, yearMonthStr);
    
    // 返回附加了保证金总和、发工资公司信息和考勤备注的薪资记录
    return {
      ...salaryWithPayrollCompany,
      depositTotal,
      attendanceRemark
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
    // 注意：从existingSalary中移除非实体字段（depositTotal、payrollCompany和attendanceRemark）
    const { depositTotal, payrollCompany, attendanceRemark, ...salaryWithoutComputedFields } = existingSalary;
    
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
        
        // 添加考勤备注信息
        const dataWithAttendanceRemarks = await this.addAttendanceRemarksToSalaries(dataWithPayrollCompany);
        
        // 将保证金总和添加到每个薪资记录中
        data = dataWithAttendanceRemarks.map(item => ({
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
  async findMySalaryById(id: number, userId: number): Promise<Salary & { depositTotal?: number; payrollCompany?: string; attendanceRemark?: string }> {
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
    
    // 获取考勤备注信息
    const yearMonthStr = salary.yearMonth instanceof Date 
      ? salary.yearMonth.toISOString().split('T')[0] 
      : salary.yearMonth;
    const attendanceRemark = await this.getAttendanceRemark(salary.name, yearMonthStr);
    
    // 返回附加了保证金总和、发工资公司信息和考勤备注的薪资记录
    return {
      ...salaryWithPayrollCompany,
      depositTotal,
      attendanceRemark
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

  /**
   * 导出薪资数据为CSV
   * @param query 导出查询条件
   * @param userId 用户ID
   * @returns CSV数据字符串
   */
  async exportToCsv(query: ExportSalaryDto, userId: number): Promise<string> {
    // 检查权限 - 只有薪资管理员和超级管理员可以导出
    const hasPermission = await this.salaryPermissionService.hasSalaryEditPermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有导出薪资记录的权限');
    }

    // 构建查询条件
    const queryBuilder = this.salaryRepository.createQueryBuilder('salary');

    // 添加查询条件
    if (query.department) {
      queryBuilder.andWhere('salary.department LIKE :department', { 
        department: `%${query.department}%` 
      });
    }

    if (query.name) {
      queryBuilder.andWhere('salary.name LIKE :name', { 
        name: `%${query.name}%` 
      });
    }

    if (query.idCard) {
      queryBuilder.andWhere('salary.idCard LIKE :idCard', { 
        idCard: `%${query.idCard}%` 
      });
    }

    if (query.type) {
      queryBuilder.andWhere('salary.type LIKE :type', { 
        type: `%${query.type}%` 
      });
    }

    // 处理时间筛选
    if (query.yearMonth) {
      // 支持 YYYY-MM 和 YYYY-MM-DD 两种格式
      if (query.yearMonth.match(/^\d{4}-\d{2}$/)) {
        // YYYY-MM 格式，查询整个月的数据
        const yearMonthPrefix = query.yearMonth;
        queryBuilder.andWhere('salary.yearMonth LIKE :yearMonth', { 
          yearMonth: `${yearMonthPrefix}%` 
        });
      } else {
        // YYYY-MM-DD 格式，精确匹配
        queryBuilder.andWhere('salary.yearMonth = :yearMonth', { 
          yearMonth: query.yearMonth 
        });
      }
    } else if (query.startDate && query.endDate) {
      queryBuilder.andWhere('salary.yearMonth BETWEEN :startDate AND :endDate', { 
        startDate: query.startDate, 
        endDate: query.endDate 
      });
    }

    // 处理布尔字段
    if (query.isPaid !== undefined) {
      queryBuilder.andWhere('salary.isPaid = :isPaid', { isPaid: query.isPaid });
    }

    if (query.isConfirmed !== undefined) {
      queryBuilder.andWhere('salary.isConfirmed = :isConfirmed', { isConfirmed: query.isConfirmed });
    }

    // 查询数据
    let salaries = await queryBuilder
      .orderBy('salary.yearMonth', 'DESC')
      .addOrderBy('salary.id', 'DESC')
      .getMany();

    // 如果有公司筛选条件，需要先添加发薪公司信息再筛选
    if (query.company) {
      const salariesWithCompany = await this.addPayrollCompanyToSalaries(salaries);
      salaries = salariesWithCompany.filter(salary => 
        salary.payrollCompany && salary.payrollCompany.includes(query.company)
      );
    }

    // 为薪资数据添加发薪公司信息
    const salariesWithCompany = await this.addPayrollCompanyToSalaries(salaries);

    // 为薪资数据添加考勤备注
    const salariesWithAttendance = await this.addAttendanceRemarksToSalaries(salariesWithCompany);

    // 定义CSV字段映射
    const fieldMapping = {
      id: 'ID',
      department: '部门',
      name: '姓名',
      idCard: '身份证号',
      type: '类型',
      baseSalary: '工资基数',
      temporaryIncrease: '底薪临时增加金额',
      temporaryIncreaseItem: '临时增加项目',
      attendanceDeduction: '考勤扣款',
      basicSalaryPayable: '应发基本工资',
      fullAttendance: '全勤',
      totalSubsidy: '补贴合计',
      seniority: '工龄',
      agencyFeeCommission: '代理费提成',
      performanceCommission: '绩效提成',
      performanceDeductions: '绩效扣除',
      businessCommission: '业务提成',
      otherDeductions: '其他扣款',
      personalMedical: '个人医疗',
      personalPension: '个人养老',
      personalUnemployment: '个人失业',
      personalInsuranceTotal: '社保个人合计',
      companyInsuranceTotal: '公司承担合计',
      depositDeduction: '保证金扣除',
      personalIncomeTax: '个税',
      other: '其他',
      totalPayable: '应发合计',
      bankCardNumber: '银行卡号',
      payrollCompany: '发薪公司',
      bankCardOrWechat: '银行卡/微信',
      cashPaid: '已发现金',
      corporatePayment: '对公',
      taxDeclaration: '个税申报',
      isPaid: '是否已发放',
      isConfirmed: '是否已确认',
      confirmedAt: '确认时间',
      attendanceRemark: '考勤备注',
      yearMonth: '年月',
      createdAt: '创建时间',
      updatedAt: '更新时间',
    };

    // 处理导出数据
    const exportData = salariesWithAttendance.map(salary => {
      const row: any = {};
      
      // 处理基本字段
      Object.keys(fieldMapping).forEach(key => {
        if (key === 'performanceDeductions') {
          // 绩效扣除数组转为字符串
          row[fieldMapping[key]] = Array.isArray(salary[key]) 
            ? salary[key].join(', ') 
            : '';
        } else if (key === 'isPaid' || key === 'isConfirmed') {
          // 布尔值转为中文
          row[fieldMapping[key]] = salary[key] ? '是' : '否';
        } else if (key === 'confirmedAt' || key === 'createdAt' || key === 'updatedAt') {
          // 日期格式化
          row[fieldMapping[key]] = salary[key] 
            ? new Date(salary[key]).toLocaleString('zh-CN') 
            : '';
        } else if (key === 'yearMonth') {
          // 年月格式化
          row[fieldMapping[key]] = salary[key] 
            ? new Date(salary[key]).toISOString().split('T')[0] 
            : '';
        } else {
          row[fieldMapping[key]] = salary[key] || '';
        }
      });

      return row;
    });

    // 生成CSV
    const parser = new Parser({
      fields: Object.values(fieldMapping),
      withBOM: true, // 添加BOM以支持中文
    });

    return parser.parse(exportData);
  }
}
