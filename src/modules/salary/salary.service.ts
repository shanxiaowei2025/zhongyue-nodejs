import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salary } from './entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { QuerySalaryDto } from './dto/query-salary.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
  ) {}

  async create(createSalaryDto: CreateSalaryDto): Promise<Salary> {
    // 先计算所有衍生字段
    const salaryWithDerivedFields = this.calculateDerivedFields(createSalaryDto);
    const salary = this.salaryRepository.create(salaryWithDerivedFields);
    return this.salaryRepository.save(salary);
  }

  // 添加批量创建薪资记录的方法
  async createBatch(createSalaryDtos: CreateSalaryDto[]): Promise<{ success: boolean; message: string; count: number }> {
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
  private calculateDerivedFields<T extends Partial<Salary>>(salaryData: T): T {
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
    
    // 计算应发基本工资
    const basicSalaryPayable = baseSalary + temporaryIncrease - attendanceDeduction;
    result.basicSalaryPayable = basicSalaryPayable;
    
    // 计算应发合计
    const totalPayable = basicSalaryPayable + 
      fullAttendance + 
      totalSubsidy + 
      seniority + 
      agencyFeeCommission + 
      result.performanceCommission + 
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
    
    return result;
  }

  async findAll(query: QuerySalaryDto) {
    console.log('薪资查询参数:', JSON.stringify(query));
    
    // 确保分页参数是有效的数字
    let { page = 1, pageSize = 10, department, name, idCard, type, company, yearMonth, startDate, endDate } = query;
    
    // 使用安全的分页参数处理函数
    const { page: safePage, pageSize: safePageSize } = safePaginationParams(page, pageSize);
    page = safePage;
    pageSize = safePageSize;
    
    const queryBuilder = this.salaryRepository.createQueryBuilder('salary');
    
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

  async findOne(id: number): Promise<Salary> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`无效的ID值: ${id}, 转换后: ${safeId}`);
      return null;
    }
    return this.salaryRepository.findOne({ where: { id: safeId } });
  }

  async update(id: number, updateSalaryDto: UpdateSalaryDto): Promise<Salary> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`更新时无效的ID值: ${id}, 转换后: ${safeId}`);
      return null;
    }
    
    // 先计算衍生字段
    const dataWithDerivedFields = this.calculateDerivedFields(updateSalaryDto);
    
    await this.salaryRepository.update(safeId, dataWithDerivedFields);
    return this.findOne(safeId);
  }

  async remove(id: number): Promise<void> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`删除时无效的ID值: ${id}, 转换后: ${safeId}`);
      return;
    }
    await this.salaryRepository.delete(safeId);
  }
}
