import { Injectable, NotFoundException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Not, In } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { Employee } from './entities/employee.entity';
import { Cron } from '@nestjs/schedule';
import { SalaryBaseHistoryService } from '../salary/salary-base-history/salary-base-history.service';
import { Request } from 'express';
import { PerformanceCommission } from '../salary/commission/entities/performance-commission.entity';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);
  // 工龄不需要自动计算的人员名单 - 添加名字的所有可能的变体
  private readonly excludedEmployeeNames = [
    '曹海玲', 
    '梁硕', 
    '李然', 
    '田帆'
  ];

  // 每个特定人员对应的固定工龄值
  private readonly fixedWorkYears = {
    '曹海玲': 12,
    '梁硕': 5,
    '李然': 8,
    '田帆': 8
  };

  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(PerformanceCommission)
    private performanceCommissionRepository: Repository<PerformanceCommission>,
    private salaryBaseHistoryService: SalaryBaseHistoryService,
  ) {
    // 启动时执行一次工龄修复
    this.fixWorkYearsForAllEmployees();
  }

  /**
   * 计算公司工龄
   * 根据入职时间计算工龄（年），最大为5年
   * @param hireDate 入职时间
   * @returns 公司工龄（年）
   */
  private calculateWorkYears(hireDate: Date): number {
    if (!hireDate) return null;
    
    const today = new Date();
    const hireDateObj = new Date(hireDate);
    
    // 计算年差
    let yearsDiff = today.getFullYear() - hireDateObj.getFullYear();
    
    // 考虑月/日，如果当前月/日小于入职月/日，年份减1
    if (
      today.getMonth() < hireDateObj.getMonth() || 
      (today.getMonth() === hireDateObj.getMonth() && today.getDate() < hireDateObj.getDate())
    ) {
      yearsDiff--;
    }
    
    // 工龄不能为负数，且最大为5年
    const result = Math.min(5, Math.max(0, yearsDiff));
    this.logger.debug(`计算工龄结果: ${yearsDiff}年，限制后为: ${result}年`);
    return result;
  }

  /**
   * 检查是否是特定人员
   * @param name 员工姓名
   * @returns 是否是特定人员
   */
  private isExcludedEmployee(name: string): boolean {
    if (!name) return false;
    
    const trimmedName = name.trim();
    // 使用精确匹配和includes都检查，确保名字能被正确识别
    const isExactMatch = Object.keys(this.fixedWorkYears).includes(trimmedName);
    const isInExcludedList = this.excludedEmployeeNames.includes(trimmedName);
    const isExcluded = isExactMatch || isInExcludedList;
    
    this.logger.debug(`检查员工 "${trimmedName}" 是否为特定人员: ${isExcluded} (精确匹配: ${isExactMatch}, 在排除列表: ${isInExcludedList})`);
    return isExcluded;
  }

  /**
   * 获取特定人员的固定工龄
   * @param name 员工姓名
   * @returns 固定工龄值，如果不是特定人员则返回null
   */
  private getFixedWorkYears(name: string): number | null {
    if (!name) return null;
    
    const trimmedName = name.trim();
    for (const [employeeName, workYears] of Object.entries(this.fixedWorkYears)) {
      if (employeeName === trimmedName) {
        this.logger.debug(`特定人员 "${trimmedName}" 的固定工龄: ${workYears}`);
        return workYears;
      }
    }
    
    // 如果在排除列表但没有固定工龄，保持原工龄不变
    if (this.excludedEmployeeNames.includes(trimmedName)) {
      this.logger.debug(`特定人员 "${trimmedName}" 在排除列表中，但没有设置固定工龄`);
      return null; 
    }
    
    return null;
  }

  /**
   * 强制限制普通员工工龄为5年
   * @param employee 员工对象
   * @returns 处理后的员工对象
   */
  private enforceWorkYearsLimit(employee: Employee): Employee {
    if (!employee) return employee;
    
    // 如果是特定人员，使用固定工龄
    if (this.isExcludedEmployee(employee.name)) {
      const fixedWorkYears = this.getFixedWorkYears(employee.name);
      if (fixedWorkYears !== null) {
        this.logger.debug(`使用特定人员 "${employee.name}" 的固定工龄: ${fixedWorkYears}`);
        employee.workYears = fixedWorkYears;
      } else {
        this.logger.debug(`特定人员 "${employee.name}" 保持原工龄不变: ${employee.workYears}`);
      }
      return employee;
    }
    
    // 如果是普通员工，限制工龄最大为5年
    if (employee.workYears > 5) {
      this.logger.debug(`限制员工 "${employee.name}" 的工龄: ${employee.workYears} -> 5`);
      employee.workYears = 5;
    }
    
    return employee;
  }

  /**
   * 创建员工
   * @param createEmployeeDto 创建员工数据
   * @returns 创建的员工
   */
  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    this.logger.log(`创建员工: ${JSON.stringify(createEmployeeDto)}`);
    
    // 检查身份证号是否已存在
    if (createEmployeeDto.idCardNumber) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { idCardNumber: createEmployeeDto.idCardNumber }
      });
      
      if (existingEmployee) {
        this.logger.warn(`身份证号已存在: ${createEmployeeDto.idCardNumber}`);
        throw new ConflictException(`身份证号 ${createEmployeeDto.idCardNumber} 已存在，不能重复使用`);
      }
    }
    
    // 记录resume字段内容，不做任何处理，直接保持原样
    if (createEmployeeDto.resume) {
      this.logger.log(`收到的resume数据: ${JSON.stringify(createEmployeeDto.resume)}`);
    }
    
    const employee = this.employeeRepository.create(createEmployeeDto);
    
    // 如果是特定人员，使用固定工龄
    if (this.isExcludedEmployee(employee.name)) {
      const fixedWorkYears = this.getFixedWorkYears(employee.name);
      if (fixedWorkYears !== null) {
        employee.workYears = fixedWorkYears;
        this.logger.log(`设置特定人员 "${employee.name}" 的固定工龄: ${fixedWorkYears}`);
      }
    } 
    // 如果是普通员工且提供了入职时间，自动计算公司工龄
    else if (employee.hireDate) {
      employee.workYears = this.calculateWorkYears(employee.hireDate);
      this.logger.log(`自动计算员工 "${employee.name}" 的工龄: ${employee.workYears}年`);
    }
    
    // 最后强制应用工龄限制规则
    this.enforceWorkYearsLimit(employee);
    
    const savedEmployee = await this.employeeRepository.save(employee);
    
    // 添加保存后的resume数据日志
    if (savedEmployee.resume) {
      this.logger.log(`保存后的resume数据: ${JSON.stringify(savedEmployee.resume)}`);
    }
    
    return savedEmployee;
  }

  /**
   * 查询员工列表
   * @param queryEmployeeDto 查询条件
   * @returns 员工列表和总数
   */
  async findAll(queryEmployeeDto: QueryEmployeeDto) {
    const { page = 1, pageSize = 10, name, departmentId, employeeType, idCardNumber, commissionRatePosition, position, rank, isResigned, bankName } = queryEmployeeDto;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    const where: any = {};
    
    if (name) {
      where.name = Like(`%${name}%`);
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (employeeType) {
      where.employeeType = employeeType;
    }
    
    if (idCardNumber) {
      where.idCardNumber = Like(`%${idCardNumber}%`);
    }

    if (commissionRatePosition) {
      where.commissionRatePosition = commissionRatePosition;
    }

    if (position) {
      where.position = Like(`%${position}%`);
    }
    
    if (rank) {
      where.rank = Like(`%${rank}%`);
    }
    
    if (isResigned !== undefined) {
      where.isResigned = isResigned;
    }
    
    if (bankName) {
      where.bankName = Like(`%${bankName}%`);
    }
    
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
    
    // 分页
    queryBuilder.skip(skip).take(pageSize);
    
    // 排序
    queryBuilder.orderBy('employee.createdAt', 'DESC');
    
    // 执行查询
    const [employees, total] = await queryBuilder.where(where).getManyAndCount();
    
    // 对每个员工强制应用工龄规则
    const processedEmployees = employees.map(employee => this.enforceWorkYearsLimit(employee));
    
    // 如果有员工工龄被修改，保存回数据库
    for (let i = 0; i < employees.length; i++) {
      if (employees[i].workYears !== processedEmployees[i].workYears) {
        await this.employeeRepository.update(employees[i].id, { 
          workYears: processedEmployees[i].workYears 
        });
        this.logger.log(`修正员工 "${employees[i].name}" 的工龄: ${employees[i].workYears} -> ${processedEmployees[i].workYears}`);
      }
    }
    
    return {
      items: processedEmployees,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 查询单个员工
   * @param id 员工ID
   * @returns 员工信息
   */
  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
    });
    
    if (!employee) {
      this.logger.warn(`员工不存在: ${id}`);
      throw new NotFoundException(`员工ID ${id} 不存在`);
    }
    
    // 强制应用工龄规则
    const processedEmployee = this.enforceWorkYearsLimit(employee);
    
    // 如果工龄被修改，保存回数据库
    if (employee.workYears !== processedEmployee.workYears) {
      await this.employeeRepository.update(id, { 
        workYears: processedEmployee.workYears 
      });
      this.logger.log(`修正员工 "${employee.name}" 的工龄: ${employee.workYears} -> ${processedEmployee.workYears}`);
    }
    
    return processedEmployee;
  }

  /**
   * 更新员工信息
   * @param id 员工ID
   * @param updateEmployeeDto 更新数据
   * @param req 请求对象，用于获取当前用户
   * @returns 更新后的员工信息
   */
  async update(id: number, updateEmployeeDto: UpdateEmployeeDto, req?: Request): Promise<Employee> {
    // 先获取原始员工信息
    const employee = await this.findOne(id);
    this.logger.log(`开始更新员工 ${id} - 名字: "${employee.name}", 当前工龄: ${employee.workYears}`);
    
    // 直接检查并打印是否是特定人员，便于调试
    const isExcluded = this.isExcludedEmployee(employee.name);
    this.logger.log(`特定人员检查 - 员工: "${employee.name}", 结果: ${isExcluded}`);
    
    if (isExcluded) {
      // 对于特定人员，获取固定工龄值
      const fixedWorkYears = this.getFixedWorkYears(employee.name);
      this.logger.log(`特定人员 "${employee.name}" 的固定工龄: ${fixedWorkYears}`);
      
      // 如果工龄值发生了变化，先直接通过SQL更新回固定值
      if (fixedWorkYears !== null && employee.workYears !== fixedWorkYears) {
        this.logger.log(`特定人员 "${employee.name}" 的工龄已被修改，正在恢复为固定值: ${employee.workYears} -> ${fixedWorkYears}`);
        await this.employeeRepository.update(id, { workYears: fixedWorkYears });
        employee.workYears = fixedWorkYears;
      }
    }
    
    // 更严格检查是否尝试修改身份证号
    if (updateEmployeeDto['idCardNumber'] !== undefined) {
      this.logger.warn(`尝试修改身份证号码: ${employee.idCardNumber} -> ${updateEmployeeDto['idCardNumber']}`);
      throw new BadRequestException('身份证号码不可以修改');
    }
    
    // 记录resume字段内容，不做任何处理，直接保持原样
    if (updateEmployeeDto.resume) {
      this.logger.log(`更新resume数据: ${JSON.stringify(updateEmployeeDto.resume)}`);
    }
    
    // 保存更新前的入职时间、工龄和底薪
    const oldHireDate = employee.hireDate;
    const originalWorkYears = employee.workYears;
    const originalBaseSalary = employee.baseSalary;
    
    // 如果更新了入职时间，记录日志
    if (updateEmployeeDto.hireDate) {
      this.logger.log(`正在更新入职时间: ${oldHireDate} -> ${updateEmployeeDto.hireDate}`);
    }
    
    // 如果直接尝试更新工龄，且是特定人员，阻止更新
    if (updateEmployeeDto.workYears !== undefined && isExcluded) {
      this.logger.warn(`尝试修改特定人员 "${employee.name}" 的工龄: ${originalWorkYears} -> ${updateEmployeeDto.workYears}，已阻止`);
      delete updateEmployeeDto.workYears;
    }
    
    // 如果是特定人员，从更新数据中移除工龄字段，防止被修改
    if (isExcluded) {
      delete updateEmployeeDto.workYears;
    }
    
    // 确保在更新对象中移除idCardNumber字段，防止意外更新
    const updateData = { ...updateEmployeeDto };
    delete updateData['idCardNumber'];
    
    // 检查是否修改了rank字段且position为记账会计，如果是则更新baseSalary
    if (updateEmployeeDto.rank && 
        (employee.position === '记账会计' || updateEmployeeDto.position === '记账会计')) {
      
      this.logger.log(`检测到rank字段更新且position为记账会计，rank值: ${updateEmployeeDto.rank}`);
      
      // 解析rank格式，例如 "P3-2" -> pLevel="P3", gradeLevel="2"
      const rankMatch = updateEmployeeDto.rank.match(/^(P\d+)-(\d+)$/);
      if (rankMatch) {
        const pLevel = rankMatch[1]; // 例如 P3
        const gradeLevel = rankMatch[2]; // 例如 2
        
        this.logger.log(`解析rank值: ${updateEmployeeDto.rank}, pLevel=${pLevel}, gradeLevel=${gradeLevel}`);
        
        try {
          // 查询匹配的绩效提成记录
          const performanceCommission = await this.performanceCommissionRepository.findOne({
            where: {
              pLevel: pLevel,
              gradeLevel: gradeLevel
            }
          });
          
          // 如果找到匹配记录，则更新baseSalary
          if (performanceCommission && performanceCommission.baseSalary !== undefined) {
            this.logger.log(`找到匹配的绩效提成记录，自动更新baseSalary: ${originalBaseSalary || 0} -> ${performanceCommission.baseSalary}`);
            updateData.baseSalary = performanceCommission.baseSalary;
          } else {
            this.logger.warn(`未找到匹配的绩效提成记录: pLevel=${pLevel}, gradeLevel=${gradeLevel}`);
          }
        } catch (error) {
          this.logger.error(`查询绩效提成记录出错:`, error);
        }
      } else {
        this.logger.warn(`rank字段格式不正确，无法自动更新baseSalary: ${updateEmployeeDto.rank}`);
      }
    }
    
    // 更新员工信息
    Object.assign(employee, updateData);
    
    // 处理工龄计算逻辑
    if (isExcluded) {
      // 对于特定人员，使用固定工龄或保持原工龄不变
      const fixedWorkYears = this.getFixedWorkYears(employee.name);
      if (fixedWorkYears !== null) {
        employee.workYears = fixedWorkYears;
        this.logger.debug(`强制设置特定人员 "${employee.name}" 的工龄为固定值: ${fixedWorkYears}`);
      } else {
        employee.workYears = originalWorkYears;
        this.logger.debug(`保持特定人员 "${employee.name}" 的工龄不变: ${originalWorkYears}`);
      }
    } else if (employee.hireDate && (updateEmployeeDto.hireDate || !oldHireDate)) {
      // 对于普通员工，如果入职时间更新，重新计算工龄
      const calculatedWorkYears = this.calculateWorkYears(employee.hireDate);
      employee.workYears = calculatedWorkYears;
      this.logger.debug(`更新普通员工 "${employee.name}" 的工龄: ${originalWorkYears || 0} -> ${calculatedWorkYears}`);
    }
    
    // 最后强制应用工龄限制规则
    this.enforceWorkYearsLimit(employee);
    
    // 打印最终结果
    this.logger.debug(`最终更新结果 - 员工: "${employee.name}", 工龄: ${employee.workYears}年`);
    
    // 保存更新后的员工信息
    const updatedEmployee = await this.employeeRepository.save(employee);
    
    // 检查底薪是否有变化，如果有则记录到工资基数历程表
    if (updateData.baseSalary !== undefined && updateData.baseSalary !== originalBaseSalary) {
      // 获取当前用户名（修改人）
      let modifiedBy = '系统';
      
      // 尝试从请求对象中获取用户信息
      if (req && req.user) {
        modifiedBy = req.user['username'] || req.user['name'] || '系统';
      }
      
      // 记录底薪变更历史
      await this.salaryBaseHistoryService.recordBaseSalaryChange(
        employee.name,
        originalBaseSalary || 0,
        updateData.baseSalary,
        modifiedBy
      );
      
      this.logger.log(`已记录员工 "${employee.name}" 的底薪变更历史: ${originalBaseSalary || 0} -> ${updateData.baseSalary}, 修改人: ${modifiedBy}`);
    }
    
    return updatedEmployee;
  }

  /**
   * 删除员工
   * @param id 员工ID
   * @returns 删除结果
   */
  async remove(id: number) {
    const employee = await this.findOne(id);
    
    this.logger.log(`删除员工: ${id}`);
    await this.employeeRepository.remove(employee);
    
    return { id, deleted: true };
  }

  /**
   * 定时任务：更新所有员工公司工龄
   * 每天凌晨1点执行
   */
  @Cron('0 1 * * *') // 每天凌晨1点执行
  async updateAllEmployeesWorkYears() {
    this.logger.log('开始执行定时任务：更新所有员工公司工龄');
    await this.fixWorkYearsForAllEmployees();
  }

  /**
   * 修复所有员工的工龄
   * 应用工龄规则：特定人员固定工龄，普通员工最大5年
   */
  async fixWorkYearsForAllEmployees() {
    try {
      // 查询所有员工
      const employees = await this.employeeRepository.find();
      this.logger.debug(`找到 ${employees.length} 名员工需要检查工龄`);
      
      // 处理特定人员的工龄
      for (const employee of employees) {
        // 处理前的工龄
        const originalWorkYears = employee.workYears;
        
        // 检查是否是特定人员
        if (this.isExcludedEmployee(employee.name)) {
          const fixedWorkYears = this.getFixedWorkYears(employee.name);
          if (fixedWorkYears !== null && employee.workYears !== fixedWorkYears) {
            // 如果是特定人员且有固定工龄值，直接设置为固定值
            employee.workYears = fixedWorkYears;
            await this.employeeRepository.update(employee.id, { workYears: fixedWorkYears });
            this.logger.debug(`修正特定人员 "${employee.name}" 的工龄: ${originalWorkYears} -> ${fixedWorkYears} (固定值)`);
          } else {
            this.logger.debug(`跳过特定人员 "${employee.name}" 的工龄更新，保持原值: ${employee.workYears}`);
          }
          continue;
        }
        
        // 处理普通员工
        if (employee.hireDate) {
          const calculatedWorkYears = this.calculateWorkYears(employee.hireDate);
          
          // 如果工龄有变化，更新数据库
          if (calculatedWorkYears !== employee.workYears) {
            employee.workYears = calculatedWorkYears;
            await this.employeeRepository.update(employee.id, { workYears: calculatedWorkYears });
            this.logger.debug(`修正普通员工 "${employee.name}" 的工龄: ${originalWorkYears || 0} -> ${calculatedWorkYears}`);
          }
        }
      }
      
      this.logger.log('员工工龄修正完成');
    } catch (error) {
      this.logger.error('修正员工工龄时出错：', error);
    }
  }

  /**
   * 根据姓名查找员工
   * @param name 员工姓名
   * @returns 员工信息
   */
  async findByName(name: string): Promise<Employee | null> {
    if (!name) {
      return null;
    }
    
    try {
      const employee = await this.employeeRepository.findOne({
        where: { name }
      });
      
      return employee || null;
    } catch (error) {
      this.logger.error(`根据姓名查找员工失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 获取所有员工（不分页）
   * @returns 所有员工信息
   */
  async findAllNoLimit(): Promise<Employee[]> {
    try {
      return await this.employeeRepository.find({
        where: { isResigned: false }
      });
    } catch (error) {
      this.logger.error(`获取所有员工失败: ${error.message}`, error.stack);
      return [];
    }
  }
} 