import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Like } from 'typeorm';
import { Salary } from './entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { QuerySalaryDto } from './dto/query-salary.dto';
import { ConfirmSalaryDto } from './dto/confirm-salary.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { SalaryPermissionService } from './services/salary-permission.service';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
    private readonly salaryPermissionService: SalaryPermissionService,
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

  async findAll(query: QuerySalaryDto, userId: number) {
    console.log('薪资查询参数:', JSON.stringify(query));
    
    // 确保分页参数是有效的数字
    let { page = 1, pageSize = 10, department, name, idCard, type, company, isPaid, yearMonth, startDate, endDate } = query;
    
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
    
    if (company) {
      queryBuilder.andWhere('salary.company LIKE :company', { company: `%${company}%` });
    }
    
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

  async findOne(id: number, userId: number): Promise<Salary> {
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
    
    return salary;
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
    const mergedData = {
      ...existingSalary,
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
    // 检查权限
    const hasPermission = await this.salaryPermissionService.hasSalaryEditPermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有确认薪资记录的权限');
    }
    
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
      confirmedAt: confirmSalaryDto.isConfirmed ? new Date() : null
    };
    
    await this.salaryRepository.update(safeId, updateData);
    return this.findOne(safeId, userId);
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
