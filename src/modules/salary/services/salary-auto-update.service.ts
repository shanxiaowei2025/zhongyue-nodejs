import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Salary } from '../entities/salary.entity';
import moment from 'moment';

@Injectable()
export class SalaryAutoUpdateService {
  private readonly logger = new Logger(SalaryAutoUpdateService.name);

  constructor(
    @InjectRepository(Salary)
    private salaryRepository: Repository<Salary>,
    private dataSource: DataSource
  ) {}

  // 导入SalaryService以使用其calculateDerivedFields方法
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

  /**
   * 每月13号凌晨2点自动执行
   */
  @Cron('0 0 2 13 * *')
  async autoUpdateSalaries() {
    try {
      this.logger.log('开始自动更新薪资表...');
      const result = await this.generateMonthlySalaries();
      this.logger.log(`薪资表自动更新完成，共更新${result.updated}条记录，新增${result.created}条记录，已包含业务提成计算`);
    } catch (error) {
      this.logger.error(`薪资表自动更新失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 计算代理费提成
   * 1. 筛选sys_expense表中auditDate为上个月且businessType为续费的记录
   * 2. 根据salesperson字段统计每个业务员的费用：
   *    - 代理费和社保代理费提成为1%
   *    - 记账软件费、开票软件费、地址费提成为10%
   * 3. 计算代理费提成
   * @param employeeName 员工姓名
   * @param firstDayOfLastMonth 上月第一天
   * @param lastDayOfLastMonth 上月最后一天
   * @returns 代理费提成金额
   */
  async calculateAgencyFeeCommission(employeeName: string, firstDayOfLastMonth: string, lastDayOfLastMonth: string): Promise<number> {
    try {
      // 1. 筛选sys_expense表中auditDate为上个月且businessType为续费的记录
      const expenseQuery = `
        SELECT 
          SUM(agencyFee) as totalAgencyFee, 
          SUM(socialInsuranceAgencyFee) as totalSocialInsuranceAgencyFee,
          SUM(accountingSoftwareFee) as totalAccountingSoftwareFee,
          SUM(invoiceSoftwareFee) as totalInvoiceSoftwareFee,
          SUM(addressFee) as totalAddressFee
        FROM sys_expense 
        WHERE 
          salesperson = ? AND 
          businessType = '续费' AND 
          auditDate BETWEEN ? AND ? AND
          status = 1
      `;
      
      const expenseResults = await this.dataSource.query(expenseQuery, [
        employeeName,
        firstDayOfLastMonth,
        lastDayOfLastMonth
      ]);
      
      // 如果没有找到数据，则返回0
      if (!expenseResults.length) {
        this.logger.debug(`员工 ${employeeName} 在上个月没有符合条件的代理费记录`);
        return 0;
      }
      
      // 2. 计算代理费用总和（提成比例1%）
      const totalAgencyFee = Number(expenseResults[0].totalAgencyFee || 0);
      const totalSocialInsuranceAgencyFee = Number(expenseResults[0].totalSocialInsuranceAgencyFee || 0);
      const agencyTotalFee = totalAgencyFee + totalSocialInsuranceAgencyFee;
      
      // 计算软件费用总和（提成比例10%）
      const totalAccountingSoftwareFee = Number(expenseResults[0].totalAccountingSoftwareFee || 0);
      const totalInvoiceSoftwareFee = Number(expenseResults[0].totalInvoiceSoftwareFee || 0);
      const totalAddressFee = Number(expenseResults[0].totalAddressFee || 0);
      const softwareTotalFee = totalAccountingSoftwareFee + totalInvoiceSoftwareFee + totalAddressFee;
      
      if (agencyTotalFee <= 0 && softwareTotalFee <= 0) {
        this.logger.debug(`员工 ${employeeName} 的代理费和软件费总和为0`);
        return 0;
      }
      
      this.logger.debug(`
        员工 ${employeeName} 的费用明细：
        代理费: ${totalAgencyFee}，
        社保代理费: ${totalSocialInsuranceAgencyFee}，
        记账软件费: ${totalAccountingSoftwareFee}，
        开票软件费: ${totalInvoiceSoftwareFee}，
        地址费: ${totalAddressFee}
      `);
      
      // 3. 计算代理费提成 = 代理费总和 × 1% + 软件费总和 × 10%
      const agencyFeeCommission = agencyTotalFee * 0.01 + softwareTotalFee * 0.1;
      
      this.logger.debug(`
        员工 ${employeeName} 的代理费提成计算: 
        代理费部分: ${agencyTotalFee} × 1% = ${agencyTotalFee * 0.01}
        软件费部分: ${softwareTotalFee} × 10% = ${softwareTotalFee * 0.1}
        总计: ${agencyFeeCommission}
      `);
      
      return agencyFeeCommission;
    } catch (error) {
      this.logger.error(`计算员工 ${employeeName} 代理费提成时出错: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * 计算业务提成
   * 1. 筛选sys_expense表中businessType是新增和值为空的，并且auditDate是上个月1号到最后一天的记录
   * 2. 根据员工的sys_employees表中的commissionRatePosition区分每个人的提成比率
   * 3. 根据不同提成比率职位计算提成
   * @param employeeName 员工姓名
   * @param firstDayOfLastMonth 上月第一天
   * @param lastDayOfLastMonth 上月最后一天
   * @returns 业务提成金额和更新的baseSalary
   */
  async calculateBusinessCommission(
    employeeName: string,
    firstDayOfLastMonth: string,
    lastDayOfLastMonth: string
  ): Promise<{businessCommission: number, newBaseSalary?: number}> {
    try {
      this.logger.log(`开始计算员工 ${employeeName} 的业务提成`);
      
      // 1. 获取员工信息
      const employeeQuery = `
        SELECT * FROM sys_employees WHERE name = ? LIMIT 1
      `;
      const employeeResults = await this.dataSource.query(employeeQuery, [employeeName]);
      
      if (!employeeResults.length) {
        this.logger.debug(`未找到员工 ${employeeName} 的信息`);
        return { businessCommission: 0 };
      }
      
      const employee = employeeResults[0];
      const commissionRatePosition = employee.commissionRatePosition || '';
      
      // 2. 筛选费用记录：新增和空的业务类型，上月已审核的
      const expenseQuery = `
        SELECT * FROM sys_expense 
        WHERE 
          salesperson = ? AND 
          (businessType = '新增' OR businessType IS NULL OR businessType = '') AND 
          status = 1 AND
          auditDate BETWEEN ? AND ?
      `;
      
      const expenseResults = await this.dataSource.query(expenseQuery, [
        employeeName,
        firstDayOfLastMonth,
        lastDayOfLastMonth
      ]);
      
      if (!expenseResults.length) {
        this.logger.debug(`员工 ${employeeName} 在上个月没有符合条件的业务记录`);
        return { businessCommission: 0 };
      }
      
      // 3. 统计所有记录的基础业务费用总和
      let totalBasicFee = 0;
      let totalOutsourceFee = 0;
      let totalExpenseBusinessCommission = 0;
      
      // 先计算所有记录的基础业务费用总和
      for (const expense of expenseResults) {
        // 基础业务费用总和
        const basicFee = 
          Number(expense.licenseFee || 0) + 
          Number(expense.agencyFee || 0) + 
          Number(expense.socialInsuranceAgencyFee || 0) + 
          Number(expense.housingFundAgencyFee || 0) + 
          Number(expense.statisticalReportFee || 0) + 
          Number(expense.changeFee || 0) + 
          Number(expense.administrativeLicenseFee || 0) + 
          Number(expense.otherBusinessFee || 0);
        
        // 外包业务费用总和
        const outsourceFee = 
          Number(expense.brandFee || 0) + 
          Number(expense.generalSealFee || 0) + 
          Number(expense.accountingSoftwareFee || 0) + 
          Number(expense.addressFee || 0) + 
          Number(expense.invoiceSoftwareFee || 0) + 
          Number(expense.otherBusinessOutsourcingFee || 0);
        
        // 累计总费用（用于后续计算提成比率）
        totalBasicFee += basicFee;
        totalOutsourceFee += outsourceFee;
      }
      
      // 4. 根据不同的提成比率职位获取提成比率
      let commissionRate = 0;
      
      if (commissionRatePosition) {
        let commissionTable = '';
        if (commissionRatePosition === '顾问') {
          commissionTable = 'sys_business_consultant_commission';
        } else if (commissionRatePosition === '销售') {
          commissionTable = 'sys_business_sales_commission';
        } else {
          commissionTable = 'sys_business_other_commission';
        }
        
        // 查询提成比率 - 基于所有记录的基础业务费用总和
        const commissionRateQuery = `
          SELECT * FROM ${commissionTable} 
          WHERE ? BETWEEN CAST(SUBSTRING_INDEX(feeRange, '-', 1) AS DECIMAL(10,2)) 
          AND CAST(SUBSTRING_INDEX(feeRange, '-', -1) AS DECIMAL(10,2))
          ${commissionRatePosition === '销售' ? "AND (type = '通用' OR (? < 2 AND type = '转正后') OR (? >= 2 AND type = '入职满2年'))" : ''}
          ORDER BY id ASC 
          LIMIT 1
        `;
        
        const commissionRateResults = await this.dataSource.query(
          commissionRateQuery, 
          commissionRatePosition === '销售' ? 
            [totalBasicFee, employee.workYears || 0, employee.workYears || 0] : 
            [totalBasicFee]
        );
        
        if (commissionRateResults.length) {
          commissionRate = Number(commissionRateResults[0].commissionRate || 0);
          this.logger.debug(`员工 ${employeeName} 的基础业务费用总和为 ${totalBasicFee}，适用的提成比率为 ${commissionRate}`);
          
          // 使用获取到的提成比率计算每条记录的提成
          for (const expense of expenseResults) {
            // 基础业务费用
            const basicFee = 
              Number(expense.licenseFee || 0) + 
              Number(expense.agencyFee || 0) + 
              Number(expense.socialInsuranceAgencyFee || 0) + 
              Number(expense.housingFundAgencyFee || 0) + 
              Number(expense.statisticalReportFee || 0) + 
              Number(expense.changeFee || 0) + 
              Number(expense.administrativeLicenseFee || 0) + 
              Number(expense.otherBusinessFee || 0);
            
            // 外包业务费用
            const outsourceFee = 
              Number(expense.brandFee || 0) + 
              Number(expense.generalSealFee || 0) + 
              Number(expense.accountingSoftwareFee || 0) + 
              Number(expense.addressFee || 0) + 
              Number(expense.invoiceSoftwareFee || 0) + 
              Number(expense.otherBusinessOutsourcingFee || 0);
            
            // 计算基础业务提成 - 使用统一的提成比率
            const basicBusinessCommission = basicFee * commissionRate;
            
            // 计算外包业务提成 (固定10%)
            const outsourceBusinessCommission = outsourceFee * 0.1;
            
            // 计算总业务提成
            const totalBusinessCommission = basicBusinessCommission + outsourceBusinessCommission;
            
            // 更新费用表中的业务提成字段
            await this.dataSource.query(`
              UPDATE sys_expense SET business_commission = ? WHERE id = ?
            `, [totalBusinessCommission, expense.id]);
            
            // 累计每个员工每条记录的业务提成
            totalExpenseBusinessCommission += totalBusinessCommission;
            
            this.logger.debug(`费用记录 ID:${expense.id} 计算业务提成: ${totalBusinessCommission}，基础业务: ${basicBusinessCommission}，外包业务: ${outsourceBusinessCommission}`);
          }
        } else {
          this.logger.debug(`未找到适用于总额 ${totalBasicFee} 的提成比率`);
          
          // 只计算外包业务提成
          for (const expense of expenseResults) {
            const outsourceFee = 
              Number(expense.brandFee || 0) + 
              Number(expense.generalSealFee || 0) + 
              Number(expense.accountingSoftwareFee || 0) + 
              Number(expense.addressFee || 0) + 
              Number(expense.invoiceSoftwareFee || 0) + 
              Number(expense.otherBusinessOutsourcingFee || 0);
            
            // 外包业务按10%计算
            const outsourceBusinessCommission = outsourceFee * 0.1;
            
            // 更新费用表中的业务提成字段
            await this.dataSource.query(`
              UPDATE sys_expense SET business_commission = ? WHERE id = ?
            `, [outsourceBusinessCommission, expense.id]);
            
            // 累计每个员工每条记录的业务提成
            totalExpenseBusinessCommission += outsourceBusinessCommission;
            
            this.logger.debug(`费用记录 ID:${expense.id} 计算业务提成(仅外包): ${outsourceBusinessCommission}`);
          }
        }
      } else {
        // 如果没有提成比率职位，则只计算外包业务提成
        for (const expense of expenseResults) {
          const outsourceFee = 
            Number(expense.brandFee || 0) + 
            Number(expense.generalSealFee || 0) + 
            Number(expense.accountingSoftwareFee || 0) + 
            Number(expense.addressFee || 0) + 
            Number(expense.invoiceSoftwareFee || 0) + 
            Number(expense.otherBusinessOutsourcingFee || 0);
          
          // 外包业务按10%计算
          const outsourceBusinessCommission = outsourceFee * 0.1;
          
          // 更新费用表中的业务提成字段
          await this.dataSource.query(`
            UPDATE sys_expense SET business_commission = ? WHERE id = ?
          `, [outsourceBusinessCommission, expense.id]);
          
          // 累计每个员工每条记录的业务提成
          totalExpenseBusinessCommission += outsourceBusinessCommission;
          
          this.logger.debug(`费用记录 ID:${expense.id} 计算业务提成(仅外包): ${outsourceBusinessCommission}`);
        }
      }
      
      // 5. 如果是销售人员，还需更新baseSalary
      let newBaseSalary = null;
      if (commissionRatePosition === '销售') {
        // 查询销售的底薪 - 基于所有记录的基础业务费用总和
        const baseSalaryQuery = `
          SELECT baseSalary FROM sys_business_sales_commission 
          WHERE ? BETWEEN CAST(SUBSTRING_INDEX(feeRange, '-', 1) AS DECIMAL(10,2)) 
          AND CAST(SUBSTRING_INDEX(feeRange, '-', -1) AS DECIMAL(10,2))
          AND (type = '通用' OR (? < 2 AND type = '转正后') OR (? >= 2 AND type = '入职满2年'))
          ORDER BY id ASC 
          LIMIT 1
        `;
        
        const baseSalaryResults = await this.dataSource.query(
          baseSalaryQuery, 
          [totalBasicFee, employee.workYears || 0, employee.workYears || 0]
        );
        
        if (baseSalaryResults.length) {
          newBaseSalary = Number(baseSalaryResults[0].baseSalary || 0);
          this.logger.debug(`员工 ${employeeName} 更新底薪为: ${newBaseSalary}`);
        }
      }
      
      return { 
        businessCommission: totalExpenseBusinessCommission,
        newBaseSalary
      };
    } catch (error) {
      this.logger.error(`计算员工 ${employeeName} 业务提成时出错: ${error.message}`, error.stack);
      return { businessCommission: 0 };
    }
  }

  /**
   * 生成指定月份的薪资数据（不指定则为上个月）
   * @param targetMonth 目标月份，格式：YYYY-MM-DD
   * @returns 更新结果
   */
  async generateMonthlySalaries(targetMonth?: string) {
    // 如果没有指定月份，默认为上个月
    const now = targetMonth ? moment(targetMonth) : moment();
    const lastMonth = now.clone().subtract(1, 'month');
    
    // 获取上个月的第一天和最后一天
    const firstDayOfLastMonth = lastMonth.startOf('month').format('YYYY-MM-DD');
    const lastDayOfLastMonth = lastMonth.endOf('month').format('YYYY-MM-DD');
    
    this.logger.log(`生成${firstDayOfLastMonth}至${lastDayOfLastMonth}期间的薪资数据`);

    // 直接使用dataSource.query执行原生SQL查询
    // 获取所有员工
    const employees = await this.dataSource.query(`
      SELECT * FROM sys_employees
    `);
    
    let created = 0;
    let updated = 0;

    for (const employee of employees) {
      try {
        // 查询是否已存在当月薪资记录
        const existingSalary = await this.salaryRepository.findOne({
          where: {
            name: employee.name,
            yearMonth: new Date(firstDayOfLastMonth)
          }
        });

        // 获取员工部门信息
        const departments = await this.dataSource.query(`
          SELECT * FROM sys_department WHERE id = ?
        `, [employee.departmentId]);
        const department = departments.length > 0 ? departments[0] : null;
        
        // 获取考勤扣款信息
        const attendanceDeductions = await this.dataSource.query(`
          SELECT * FROM sys_attendance_deduction 
          WHERE name = ? 
          AND yearMonth BETWEEN ? AND ?
          LIMIT 1
        `, [employee.name, firstDayOfLastMonth, lastDayOfLastMonth]);
        const attendanceDeduction = attendanceDeductions.length > 0 ? attendanceDeductions[0] : null;

        // 获取补贴汇总信息
        const subsidySummaries = await this.dataSource.query(`
          SELECT * FROM sys_subsidy_summary 
          WHERE name = ? 
          AND yearMonth BETWEEN ? AND ?
          LIMIT 1
        `, [employee.name, firstDayOfLastMonth, lastDayOfLastMonth]);
        const subsidySummary = subsidySummaries.length > 0 ? subsidySummaries[0] : null;

        // 获取朋友圈奖励信息
        const friendCirclePayments = await this.dataSource.query(`
          SELECT * FROM sys_friend_circle_payment 
          WHERE name = ? 
          AND yearMonth BETWEEN ? AND ?
          LIMIT 1
        `, [employee.name, firstDayOfLastMonth, lastDayOfLastMonth]);
        const friendCirclePayment = friendCirclePayments.length > 0 ? friendCirclePayments[0] : null;

        // 获取社保信息
        const socialInsurances = await this.dataSource.query(`
          SELECT * FROM sys_social_insurance 
          WHERE name = ? 
          AND yearMonth BETWEEN ? AND ?
          LIMIT 1
        `, [employee.name, firstDayOfLastMonth, lastDayOfLastMonth]);
        const socialInsurance = socialInsurances.length > 0 ? socialInsurances[0] : null;

        // 计算代理费提成
        const agencyFeeCommission = await this.calculateAgencyFeeCommission(
          employee.name, 
          firstDayOfLastMonth, 
          lastDayOfLastMonth
        );
        
        // 计算业务提成
        const businessCommissionResult = await this.calculateBusinessCommission(
          employee.name, 
          firstDayOfLastMonth, 
          lastDayOfLastMonth
        );

        // 查询员工的绩效信息
        let performanceCommission = 0;
        if (employee.rank && employee.position === '记账会计') {
          // 从rank中解析P级和档级
          const rankMatch = employee.rank.match(/^(P\d+)-(\d+)$/);
          if (rankMatch) {
            const pLevel = rankMatch[1]; // 例如 P3
            const gradeLevel = rankMatch[2]; // 例如 2
            
            try {
              // 查询匹配的绩效提成记录
              const performanceCommissionResults = await this.dataSource.query(`
                SELECT * FROM sys_performance_commission 
                WHERE pLevel = ? AND gradeLevel = ? 
                LIMIT 1
              `, [pLevel, gradeLevel]);
              
              if (performanceCommissionResults.length > 0) {
                performanceCommission = Number(performanceCommissionResults[0].performance || 0);
                this.logger.debug(`员工 ${employee.name} 匹配到绩效: ${performanceCommission}`);
              }
            } catch (error) {
              this.logger.error(`查询员工 ${employee.name} 的绩效提成记录出错: ${error.message}`, error.stack);
            }
          }
        }

        // 准备薪资数据
        const salaryData: any = {
          name: employee.name,
          department: department ? department.name : '未分配',
          idCard: employee.idCardNumber || '',
          type: employee.employeeType || '未设置',
          // 如果是销售且计算出新的基本工资，则使用新值，否则使用员工表中的值
          baseSalary: businessCommissionResult.newBaseSalary !== null && 
                      businessCommissionResult.newBaseSalary !== undefined ? 
                      businessCommissionResult.newBaseSalary : employee.baseSalary || 0,
          temporaryIncrease: existingSalary?.temporaryIncrease || 0,
          temporaryIncreaseItem: existingSalary?.temporaryIncreaseItem || '',
          attendanceDeduction: attendanceDeduction?.attendanceDeduction || 0,
          fullAttendance: attendanceDeduction?.fullAttendanceBonus || 0,
          totalSubsidy: subsidySummary?.totalSubsidy || 0,
          seniority: (employee.workYears || 0) * 100,
          agencyFeeCommission: agencyFeeCommission,
          performanceCommission: performanceCommission,
          performanceDeductions: existingSalary?.performanceDeductions || [],
          businessCommission: businessCommissionResult.businessCommission,
          otherDeductions: friendCirclePayment?.payment || 0,
          personalMedical: socialInsurance?.personalMedical || 0,
          personalPension: socialInsurance?.personalPension || 0,
          personalUnemployment: socialInsurance?.personalUnemployment || 0,
          personalInsuranceTotal: socialInsurance?.personalTotal || 0,
          companyInsuranceTotal: socialInsurance?.companyTotal || 0,
          depositDeduction: existingSalary?.depositDeduction || 0,
          personalIncomeTax: existingSalary?.personalIncomeTax || 0,
          other: existingSalary?.other || 0,
          bankCardNumber: employee.bankCardNumber || '',
          company: existingSalary?.company || '',
          bankCardOrWechat: existingSalary?.bankCardOrWechat || 0,
          cashPaid: existingSalary?.cashPaid || 0,
          yearMonth: new Date(firstDayOfLastMonth),
        };
        
        // 使用calculateDerivedFields方法计算所有衍生字段，包括绩效佣金
        const processedSalaryData = this.calculateDerivedFields(salaryData);

        if (existingSalary) {
          // 更新现有记录
          await this.salaryRepository.update(existingSalary.id, processedSalaryData);
          updated++;
          this.logger.debug(`更新员工 ${employee.name} 的薪资记录`);
        } else {
          // 创建新记录
          await this.salaryRepository.save(processedSalaryData);
          created++;
          this.logger.debug(`创建员工 ${employee.name} 的薪资记录`);
        }
        
        // 如果是销售且有新的基本工资，更新员工表中的基本工资
        if (businessCommissionResult.newBaseSalary !== null && 
            businessCommissionResult.newBaseSalary !== undefined) {
          await this.dataSource.query(`
            UPDATE sys_employees SET baseSalary = ? WHERE name = ?
          `, [businessCommissionResult.newBaseSalary, employee.name]);
          this.logger.log(`更新员工 ${employee.name} 的基本工资为 ${businessCommissionResult.newBaseSalary}`);
        }
      } catch (error) {
        this.logger.error(`处理员工 ${employee.name} 薪资时出错: ${error.message}`, error.stack);
      }
    }

    return { created, updated };
  }

  /**
   * 手动触发生成月度薪资（用于测试）
   * @param month 目标月份，格式：YYYY-MM-DD
   * @returns 处理结果
   */
  async manualGenerateSalaries(month?: string) {
    try {
      const result = await this.generateMonthlySalaries(month);
      return { 
        success: true, 
        message: `薪资数据生成成功，共更新${result.updated}条记录，新增${result.created}条记录`,
        details: result
      };
    } catch (error) {
      this.logger.error(`手动生成薪资数据失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: `薪资数据生成失败: ${error.message}`
      };
    }
  }
} 