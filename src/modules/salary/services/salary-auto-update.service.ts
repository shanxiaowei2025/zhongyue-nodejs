import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThan, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Salary } from '../entities/salary.entity';
import moment from 'moment';
import 'moment/locale/zh-cn';

@Injectable()
export class SalaryAutoUpdateService {
  private readonly logger = new Logger(SalaryAutoUpdateService.name);

  constructor(
    @InjectRepository(Salary)
    private salaryRepository: Repository<Salary>,
    private dataSource: DataSource,
  ) {}

  // 导入SalaryService以使用其calculateDerivedFields方法
  private calculateDerivedFields<T extends Partial<Salary>>(salaryData: T): T {
    const result = { ...salaryData };

    // 基本字段值处理，确保是数字
    const baseSalary = Number(result.baseSalary || 0);
    const temporaryIncrease = Number(result.temporaryIncrease || 0);
    const attendanceDeduction = Number(result.attendanceDeduction || 0);
    const fullAttendance = Number(result.fullAttendance || 0);
    const departmentHeadSubsidy = Number(result.departmentHeadSubsidy || 0);
    const positionAllowance = Number(result.positionAllowance || 0);
    const oilSubsidy = Number(result.oilSubsidy || 0);
    const mealSubsidy = Number(result.mealSubsidy || 0);
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
    if (
      result.performanceDeductions &&
      Array.isArray(result.performanceDeductions)
    ) {
      performanceDeductionTotal = result.performanceDeductions.reduce(
        (sum, deduction) => sum + Number(deduction || 0),
        0,
      );

      // 如果绩效扣除总额大于1，则重置为1
      if (performanceDeductionTotal > 1) {
        performanceDeductionTotal = 1;
      }
    }

    // 计算绩效佣金 = 原始绩效佣金 * (1 - 绩效扣除总额)
    const originalPerformanceCommission = Number(
      result.performanceCommission || 0,
    );
    result.performanceCommission =
      originalPerformanceCommission * (1 - performanceDeductionTotal);

    // 计算应发基本工资
    const basicSalaryPayable =
      baseSalary + temporaryIncrease - attendanceDeduction;
    result.basicSalaryPayable = basicSalaryPayable;

    // 计算应发合计
    const totalPayable =
      basicSalaryPayable +
      fullAttendance +
      departmentHeadSubsidy +
      positionAllowance +
      oilSubsidy +
      mealSubsidy +
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
   * 注意：已取消自动定时任务，如需重新启用请取消下方注释
   */
  // @Cron('0 0 2 13 * *')
  async autoUpdateSalaries() {
    try {
      this.logger.log('开始自动更新薪资表...');
      const result = await this.generateMonthlySalaries();
      this.logger.log(
        `薪资表自动更新完成，共更新${result.updated}条记录，新增${result.created}条记录，已包含业务提成计算`,
      );
    } catch (error) {
      this.logger.error(`薪资表自动更新失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 计算代理费提成
   * 1. 筛选sys_expense表中chargeDate在指定时间范围内的记录
   * 2. 根据salesperson字段统计每个业务员的费用：
   *    - 代理费和社保代理费提成为1%
   *    - 记账软件费、开票软件费、地址费提成为10%
   * 3. 计算代理费提成
   * @param employeeName 员工姓名
   * @param startDate 开始日期（上个月1号）
   * @param endDate 结束日期（上个月最后一天）
   * @returns 代理费提成金额
   */
  async calculateAgencyFeeCommission(
    employeeName: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    try {
      // 1. 筛选sys_expense表中chargeDate为上个月的记录（不限制businessType，因为所有类型的费用都可能产生提成）
      // socialInsuranceAgencyFee 只有在 socialInsuranceBusinessType = '续费' 时才参与计算
      const expenseQuery = `
        SELECT 
          SUM(CASE WHEN businessType = '续费' THEN agencyFee ELSE 0 END) as totalAgencyFee, 
          SUM(CASE WHEN socialInsuranceBusinessType = '续费' THEN socialInsuranceAgencyFee ELSE 0 END) as totalSocialInsuranceAgencyFee,
          SUM(accountingSoftwareFee) as totalAccountingSoftwareFee,
          SUM(invoiceSoftwareFee) as totalInvoiceSoftwareFee,
          SUM(addressFee) as totalAddressFee
        FROM sys_expense 
        WHERE 
          salesperson = ? AND 
          chargeDate BETWEEN ? AND ? AND
          status = 1
      `;

      const expenseResults = await this.dataSource.query(expenseQuery, [
        employeeName,
        startDate,
        endDate,
      ]);

      // 如果没有找到数据，则返回0
      if (!expenseResults.length) {
        this.logger.debug(
          `员工 ${employeeName} 在上个月没有符合条件的费用记录`,
        );
        return 0;
      }

      // 2. 计算代理费用总和（提成比例1%）
      const totalAgencyFee = Number(expenseResults[0].totalAgencyFee || 0);
      const totalSocialInsuranceAgencyFee = Number(
        expenseResults[0].totalSocialInsuranceAgencyFee || 0,
      );
      const agencyTotalFee = totalAgencyFee + totalSocialInsuranceAgencyFee;

      // 计算软件费用总和（提成比例10%）
      const totalAccountingSoftwareFee = Number(
        expenseResults[0].totalAccountingSoftwareFee || 0,
      );
      const totalInvoiceSoftwareFee = Number(
        expenseResults[0].totalInvoiceSoftwareFee || 0,
      );
      const totalAddressFee = Number(expenseResults[0].totalAddressFee || 0);
      const softwareTotalFee =
        totalAccountingSoftwareFee + totalInvoiceSoftwareFee + totalAddressFee;

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
      const agencyFeeCommission =
        agencyTotalFee * 0.01 + softwareTotalFee * 0.1;

      this.logger.debug(`
        员工 ${employeeName} 的代理费提成计算: 
        代理费部分: ${agencyTotalFee} × 1% = ${agencyTotalFee * 0.01}
        软件费部分: ${softwareTotalFee} × 10% = ${softwareTotalFee * 0.1}
        总计: ${agencyFeeCommission}
      `);

      return agencyFeeCommission;
    } catch (error) {
      this.logger.error(
        `计算员工 ${employeeName} 代理费提成时出错: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * 更新费用记录的代理费提成
   * 为每条业务的费用记录计算并填充agency_commission字段
   * @param employeeName 员工姓名
   * @param startDate 开始日期（上个月2号）
   * @param endDate 结束日期（本月1号）
   */
  async updateExpenseAgencyCommission(
    employeeName: string,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    try {
      // 1. 查询该员工指定时间范围内的费用记录
      const expenseQuery = `
        SELECT 
          id,
          businessType,
          agencyFee,
          socialInsuranceAgencyFee,
          socialInsuranceBusinessType,
          accountingSoftwareFee,
          invoiceSoftwareFee,
          addressFee
        FROM sys_expense 
        WHERE 
          salesperson = ? AND 
          chargeDate BETWEEN ? AND ? AND
          status = 1
      `;

      const expenseRecords = await this.dataSource.query(expenseQuery, [
        employeeName,
        startDate,
        endDate,
      ]);

      if (!expenseRecords.length) {
        this.logger.debug(
          `员工 ${employeeName} 在上个月没有符合条件的费用记录`,
        );
        return;
      }

      // 2. 为每条记录计算代理费提成
      for (const record of expenseRecords) {
        // 代理费类（提成比例1%）- 只有续费业务才计算代理费提成
        const agencyFee = record.businessType === '续费' 
          ? Number(record.agencyFee || 0) 
          : 0;
        // socialInsuranceAgencyFee 只有在 socialInsuranceBusinessType = '续费' 时才参与计算
        const socialInsuranceAgencyFee = record.socialInsuranceBusinessType === '续费' 
          ? Number(record.socialInsuranceAgencyFee || 0) 
          : 0;
        const agencyTotalFee = agencyFee + socialInsuranceAgencyFee;

        // 软件费类（提成比例10%）
        const accountingSoftwareFee = Number(record.accountingSoftwareFee || 0);
        const invoiceSoftwareFee = Number(record.invoiceSoftwareFee || 0);
        const addressFee = Number(record.addressFee || 0);
        const softwareTotalFee = accountingSoftwareFee + invoiceSoftwareFee + addressFee;

        // 计算该条记录的代理费提成
        const agencyCommission = agencyTotalFee * 0.01 + softwareTotalFee * 0.1;

        // 更新数据库 - 无论提成是否为0都要更新，确保数据一致性
        await this.dataSource.query(
          `UPDATE sys_expense SET agency_commission = ? WHERE id = ?`,
          [agencyCommission, record.id],
        );

        this.logger.debug(`
          更新费用记录ID ${record.id} 的代理费提成: 
          代理费: ${agencyFee}, 社保代理费: ${socialInsuranceAgencyFee} (socialInsuranceBusinessType: ${record.socialInsuranceBusinessType})
          记账软件费: ${accountingSoftwareFee}, 开票软件费: ${invoiceSoftwareFee}, 地址费: ${addressFee}
          代理费提成: ${agencyCommission}
        `);
      }

      this.logger.log(
        `已完成员工 ${employeeName} 共 ${expenseRecords.length} 条费用记录的代理费提成更新`,
      );
    } catch (error) {
      this.logger.error(
        `更新员工 ${employeeName} 费用记录的代理费提成时出错: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 清空指定日期范围内费用记录的提成字段
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async clearExpenseCommissionFields(
    startDate: string,
    endDate: string,
  ): Promise<void> {
    try {
      this.logger.log('开始清空费用记录的提成字段');

      // 清空指定日期范围内费用记录的提成字段
      const clearQuery = `
        UPDATE sys_expense 
        SET 
          business_commission = 0,
          business_commission_own = 0,
          business_commission_outsource = 0,
          agency_commission = 0
        WHERE 
          chargeDate BETWEEN ? AND ? AND
          status = 1
      `;

      const result = await this.dataSource.query(clearQuery, [
        startDate,
        endDate,
      ]);

      this.logger.log(
        `已清空${startDate}至${endDate}期间费用记录的提成字段，影响行数：${result.affectedRows || 0}`,
      );
    } catch (error) {
      this.logger.error(
        `清空费用记录提成字段失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 计算业务提成
   * 1. 筛选sys_expense表中businessType是新增和值为空的，并且chargeDate在指定时间范围内的记录
   * 2. 根据员工的sys_employees表中的commissionRatePosition区分每个人的提成比率
   * 3. 根据不同提成比率职位计算提成
   * @param employeeName 员工姓名
   * @param startDate 开始日期（上个月1号）
   * @param endDate 结束日期（上个月最后一天）
   * @returns 业务提成金额和更新的baseSalary
   */
  async calculateBusinessCommission(
    employeeName: string,
    startDate: string,
    endDate: string,
  ): Promise<{ businessCommission: number; newBaseSalary?: number }> {
    try {
      this.logger.log(`开始计算员工 ${employeeName} 的业务提成`);

      // 1. 获取员工信息
      const employeeQuery = `
        SELECT * FROM sys_employees WHERE name = ? LIMIT 1
      `;
      const employeeResults = await this.dataSource.query(employeeQuery, [
        employeeName,
      ]);

      if (!employeeResults.length) {
        this.logger.debug(`未找到员工 ${employeeName} 的信息`);
        return { businessCommission: 0 };
      }

      const employee = employeeResults[0];
      const commissionRatePosition = employee.commissionRatePosition || '';

      // 2. 筛选费用记录：只筛选新增业务和空的业务类型，指定时间范围内已审核的
      const expenseQuery = `
        SELECT * FROM sys_expense 
        WHERE 
          salesperson = ? AND 
          (businessType = '新增' OR businessType IS NULL OR businessType = '') AND 
          status = 1 AND
          chargeDate BETWEEN ? AND ?
      `;

      const expenseResults = await this.dataSource.query(expenseQuery, [
        employeeName,
        startDate,
        endDate,
      ]);

      if (!expenseResults.length) {
        this.logger.debug(
          `员工 ${employeeName} 在上个月没有符合条件的业务记录`,
        );
        return { businessCommission: 0 };
      }

      // 3. 统计所有记录的基础业务费用总和
      let totalBasicFee = 0;
      let totalOutsourceFee = 0;
      let totalExpenseBusinessCommission = 0;

      // 先计算所有记录的基础业务费用总和
      for (const expense of expenseResults) {
        // 基础业务费用总和
        // socialInsuranceAgencyFee 只有在 socialInsuranceBusinessType = '新增' 时才参与计算
        const socialInsuranceAgencyFee = expense.socialInsuranceBusinessType === '新增' 
          ? Number(expense.socialInsuranceAgencyFee || 0) 
          : 0;
        
        const basicFee =
          Number(expense.licenseFee || 0) +
          Number(expense.agencyFee || 0) +
          socialInsuranceAgencyFee +
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
          commissionRatePosition === '销售'
            ? [totalBasicFee, employee.workYears || 0, employee.workYears || 0]
            : [totalBasicFee],
        );

        if (commissionRateResults.length) {
          commissionRate = Number(commissionRateResults[0].commissionRate || 0);
          this.logger.debug(
            `员工 ${employeeName} 的基础业务费用总和为 ${totalBasicFee}，适用的提成比率为 ${commissionRate}`,
          );

          // 使用获取到的提成比率计算每条记录的提成
          for (const expense of expenseResults) {
            // 基础业务费用
            // socialInsuranceAgencyFee 只有在 socialInsuranceBusinessType = '新增' 时才参与计算
            const socialInsuranceAgencyFee = expense.socialInsuranceBusinessType === '新增' 
              ? Number(expense.socialInsuranceAgencyFee || 0) 
              : 0;
            
            const basicFee =
              Number(expense.licenseFee || 0) +
              Number(expense.agencyFee || 0) +
              socialInsuranceAgencyFee +
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

            // 计算基础业务提成
            let basicBusinessCommission = 0;
            
            // 检查是否有"两年赠一年"的特殊情况
            if (expense.giftAgencyDuration === '两年赠一年' && Number(expense.agencyFee || 0) > 0) {
              // 对代理费部分特殊处理：agencyFee除以2乘以(commissionRate+0.05)
              const agencyFee = Number(expense.agencyFee || 0);
              const specialAgencyCommission = (agencyFee / 2) * (commissionRate + 0.05);
              
              // 计算其他基础业务费用的提成(不包括agencyFee)
              const socialInsuranceAgencyFee = expense.socialInsuranceBusinessType === '新增' 
                ? Number(expense.socialInsuranceAgencyFee || 0) 
                : 0;
              
              const otherBasicFee =
                Number(expense.licenseFee || 0) +
                socialInsuranceAgencyFee +
                Number(expense.housingFundAgencyFee || 0) +
                Number(expense.statisticalReportFee || 0) +
                Number(expense.changeFee || 0) +
                Number(expense.administrativeLicenseFee || 0) +
                Number(expense.otherBusinessFee || 0);
                
              const otherBasicCommission = otherBasicFee * commissionRate;
              
              // 合并特殊处理的代理费提成和其他基础业务提成
              basicBusinessCommission = specialAgencyCommission + otherBasicCommission;
              
              this.logger.debug(
                `费用记录 ID:${expense.id} 特殊处理"两年赠一年": 代理费=${agencyFee}, 特殊提成率=${commissionRate + 0.05}, 特殊代理费提成=${specialAgencyCommission}`
              );
            } else {
              // 常规计算基础业务提成 - 使用统一的提成比率
              basicBusinessCommission = basicFee * commissionRate;
            }

            // 计算外包业务提成 (固定10%)
            const outsourceBusinessCommission = outsourceFee * 0.1;
            
            // 计算特殊业务提成（直接使用手工设置的金额）
            const specialCommission = Number(expense.specialBusinessCommission || 0);

            // 计算总业务提成
            const totalBusinessCommission =
              basicBusinessCommission + outsourceBusinessCommission + specialCommission;

            // 更新费用表中的业务提成字段（保留原有字段，同时更新新字段）
            await this.dataSource.query(
              `
              UPDATE sys_expense SET 
                business_commission = ?, 
                business_commission_own = ?, 
                business_commission_outsource = ?
              WHERE id = ?
            `,
              [totalBusinessCommission, basicBusinessCommission, outsourceBusinessCommission, expense.id],
            );

            // 累计每个员工每条记录的业务提成
            totalExpenseBusinessCommission += totalBusinessCommission;

            this.logger.debug(
              `费用记录 ID:${expense.id} 计算业务提成: ${totalBusinessCommission}，基础业务: ${basicBusinessCommission}，外包业务: ${outsourceBusinessCommission}，特殊业务: ${specialCommission}`,
            );
          }
        } else {
          this.logger.debug(`未找到适用于总额 ${totalBasicFee} 的提成比率`);

          // 计算业务提成（可能包括特殊处理的代理费提成和外包业务提成）
          for (const expense of expenseResults) {
            // 计算外包业务提成
            const outsourceFee =
              Number(expense.brandFee || 0) +
              Number(expense.generalSealFee || 0) +
              Number(expense.accountingSoftwareFee || 0) +
              Number(expense.addressFee || 0) +
              Number(expense.invoiceSoftwareFee || 0) +
              Number(expense.otherBusinessOutsourcingFee || 0);

            // 外包业务按10%计算
            const outsourceBusinessCommission = outsourceFee * 0.1;
            
            // 初始化基础业务提成为0
            let basicBusinessCommission = 0;
            
            // 检查是否有"两年赠一年"的特殊情况
            if (expense.giftAgencyDuration === '两年赠一年' && Number(expense.agencyFee || 0) > 0) {
              // 虽然没找到适合的提成比率，但对于"两年赠一年"的情况，我们用5%作为基础提成率
              const agencyFee = Number(expense.agencyFee || 0);
              basicBusinessCommission = (agencyFee / 2) * 0.05;
              
              this.logger.debug(
                `费用记录 ID:${expense.id} 特殊处理"两年赠一年"(无匹配比率): 代理费=${agencyFee}, 特殊提成率=5%, 特殊代理费提成=${basicBusinessCommission}`
              );
            }
            
            // 计算特殊业务提成（直接使用手工设置的金额）
            const specialCommission = Number(expense.specialBusinessCommission || 0);
            
            // 计算总业务提成
            const totalBusinessCommission = basicBusinessCommission + outsourceBusinessCommission + specialCommission;

            // 更新费用表中的业务提成字段
            await this.dataSource.query(
              `
              UPDATE sys_expense SET 
                business_commission = ?, 
                business_commission_own = ?, 
                business_commission_outsource = ?
              WHERE id = ?
            `,
              [totalBusinessCommission, basicBusinessCommission, outsourceBusinessCommission, expense.id],
            );

            // 累计每个员工每条记录的业务提成
            totalExpenseBusinessCommission += totalBusinessCommission;

            this.logger.debug(
              `费用记录 ID:${expense.id} 计算业务提成: 基础业务=${basicBusinessCommission}, 外包业务=${outsourceBusinessCommission}, 特殊业务=${specialCommission}, 总计=${totalBusinessCommission}`,
            );
          }
        }
      } else {
        // 如果没有提成比率职位，主要计算外包业务提成，但特殊情况下也处理代理费
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
          
          // 初始化基础业务提成为0
          let basicBusinessCommission = 0;
          
          // 检查是否有"两年赠一年"的特殊情况
          if (expense.giftAgencyDuration === '两年赠一年' && Number(expense.agencyFee || 0) > 0) {
            // 虽然没有提成比率职位，但对于"两年赠一年"的情况，我们用5%作为基础提成率
            const agencyFee = Number(expense.agencyFee || 0);
            basicBusinessCommission = (agencyFee / 2) * 0.05;
            
            this.logger.debug(
              `费用记录 ID:${expense.id} 特殊处理"两年赠一年"(无提成比率职位): 代理费=${agencyFee}, 特殊提成率=5%, 特殊代理费提成=${basicBusinessCommission}`
            );
          }
          
          // 计算特殊业务提成（直接使用手工设置的金额）
          const specialCommission = Number(expense.specialBusinessCommission || 0);
          
          // 计算总业务提成
          const totalBusinessCommission = basicBusinessCommission + outsourceBusinessCommission + specialCommission;

          // 更新费用表中的业务提成字段
          await this.dataSource.query(
            `
            UPDATE sys_expense SET 
              business_commission = ?, 
              business_commission_own = ?, 
              business_commission_outsource = ?
            WHERE id = ?
          `,
            [totalBusinessCommission, basicBusinessCommission, outsourceBusinessCommission, expense.id],
          );

          // 累计每个员工每条记录的业务提成
          totalExpenseBusinessCommission += totalBusinessCommission;

          this.logger.debug(
            `费用记录 ID:${expense.id} 计算业务提成: 基础业务=${basicBusinessCommission}, 外包业务=${outsourceBusinessCommission}, 特殊业务=${specialCommission}, 总计=${totalBusinessCommission}`,
          );
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

        const baseSalaryResults = await this.dataSource.query(baseSalaryQuery, [
          totalBasicFee,
          employee.workYears || 0,
          employee.workYears || 0,
        ]);

        if (baseSalaryResults.length) {
          newBaseSalary = Number(baseSalaryResults[0].baseSalary || 0);
          this.logger.debug(
            `员工 ${employeeName} 更新底薪为: ${newBaseSalary}`,
          );
        }
      }

      return {
        businessCommission: totalExpenseBusinessCommission,
        newBaseSalary,
      };
    } catch (error) {
      this.logger.error(
        `计算员工 ${employeeName} 业务提成时出错: ${error.message}`,
        error.stack,
      );
      return { businessCommission: 0 };
    }
  }

  /**
   * 检查并更新记账会计的绩效扣除
   * 根据上个月账务自查数据，调整薪资表中记账会计的performanceDeductions字段
   * 统计所有状态的账务自查记录，不限于已确认的记录
   * @param lastMonth 上个月对象
   */
  async checkAndUpdateAccountantPerformance(
    lastMonth: moment.Moment,
  ): Promise<void> {
    try {
      this.logger.warn(
        '██████████ 开始检查记账会计账务自查记录并更新绩效扣除... ██████████',
      );

      // 获取上个月的第一天和最后一天
      const firstDayOfLastMonth = lastMonth
        .startOf('month')
        .format('YYYY-MM-DD');
      const lastDayOfLastMonth = lastMonth.endOf('month').format('YYYY-MM-DD');

      this.logger.warn(
        `统计${firstDayOfLastMonth}至${lastDayOfLastMonth}期间的账务自查记录`,
      );

      // 1. 获取所有记账会计
      const accountantSQL = `SELECT * FROM sys_employees WHERE position = '记账会计'`;
      this.logger.warn(`执行SQL: ${accountantSQL}`);

      const accountants = await this.dataSource.query(accountantSQL);

      this.logger.warn(
        `查询结果: ${JSON.stringify(accountants).substring(0, 200)}${accountants && accountants.length > 0 ? '...' : ''}`,
      );

      if (!accountants || accountants.length === 0) {
        this.logger.warn('⚠️⚠️⚠️ 未找到任何记账会计，跳过绩效扣除调整 ⚠️⚠️⚠️');
        return;
      }

      this.logger.warn(`找到${accountants.length}名记账会计`);

      // 2. 筛选账务自查表，上个月的所有记录，不再限制状态
      const inspectionSQL = `
        SELECT * FROM sys_financial_self_inspection 
        WHERE inspectionDate BETWEEN ? AND ?
      `;
      this.logger.warn(
        `执行SQL: ${inspectionSQL.replace(/\n\s+/g, ' ')} [参数: ${firstDayOfLastMonth}, ${lastDayOfLastMonth}]`,
      );

      const inspectionRecords = await this.dataSource.query(inspectionSQL, [
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      ]);

      this.logger.warn(
        `查询结果: ${JSON.stringify(inspectionRecords).substring(0, 200)}${inspectionRecords && inspectionRecords.length > 0 ? '...' : ''}`,
      );

      if (!inspectionRecords || inspectionRecords.length === 0) {
        this.logger.warn(
          '⚠️⚠️⚠️ 上月没有账务自查记录，但将继续统计并显示结果 ⚠️⚠️⚠️',
        );
      } else {
        this.logger.warn(
          `找到${inspectionRecords.length}条账务自查记录`,
        );
      }

      // 3. 统计每个记账会计的自查和抽查数量
      const accountantStats = {};

      for (const accountant of accountants) {
        accountantStats[accountant.name] = {
          selfInspectionCount: 0,
          inspectionByOthersCount: 0,
          reviewCount: 0,
          mainRank: 0,
        };

        // 解析记账会计的职级
        if (accountant.rank) {
          const rankMatch = accountant.rank.match(/^P(\d+)-\d+$/);
          if (rankMatch) {
            accountantStats[accountant.name].mainRank = parseInt(
              rankMatch[1],
              10,
            );
          }
        }
      }

      // 只有当有记录时才进行计数
      if (inspectionRecords && inspectionRecords.length > 0) {
        // 4. 计算自查和抽查数量
        for (const record of inspectionRecords) {
          if (record.bookkeepingAccountant === record.inspector) {
            // 自查记录
            if (accountantStats[record.bookkeepingAccountant]) {
              accountantStats[record.bookkeepingAccountant]
                .selfInspectionCount++;
              // 移除详细日志
            }
          } else if (accountantStats[record.inspector]) {
            // 抽查记录 - 统计抽查人的抽查数量
            accountantStats[record.inspector].inspectionByOthersCount++;
            // 移除详细日志
          }

          // 统计复查数量（特别是曹海玲的复查数量）
          if (record.reviewer && accountantStats[record.reviewer]) {
            accountantStats[record.reviewer].reviewCount++;
            // 移除详细日志
          }
        }
      }

      this.logger.warn('记账会计统计结果:');
      // 添加表格样式的日志输出，更清晰地展示统计数据
      this.logger.warn(
        '------------------------------------------------------',
      );
      this.logger.warn(
        '| 姓名       | 职级   | 自查数量 | 抽查数量 | 复查数量 |',
      );
      this.logger.warn(
        '------------------------------------------------------',
      );
      Object.keys(accountantStats).forEach((name) => {
        const stats = accountantStats[name];
        const paddedName = name.padEnd(10, ' ');
        const paddedRank = `P${stats.mainRank}`.padEnd(6, ' ');
        const paddedSelf = `${stats.selfInspectionCount}`.padStart(8, ' ');
        const paddedInspect = `${stats.inspectionByOthersCount}`.padStart(
          8,
          ' ',
        );
        const paddedReview = `${stats.reviewCount}`.padStart(8, ' ');

        this.logger.warn(
          `| ${paddedName} | ${paddedRank} | ${paddedSelf} | ${paddedInspect} | ${paddedReview} |`,
        );

        // 检查是否符合规则
        let ruleApplied = false;

        if (name === '曹海玲') {
          if (stats.reviewCount < 12) {
            this.logger.warn(
              `❌ ${name} 复查数量 ${stats.reviewCount} < 12，需扣除绩效`,
            );
            ruleApplied = true;
          }
        } else if (stats.mainRank === 2) {
          if (stats.selfInspectionCount < 30) {
            this.logger.warn(
              `❌ ${name} (P2级别) 自查数量 ${stats.selfInspectionCount} < 30，需扣除绩效`,
            );
            ruleApplied = true;
          }
        } else if (stats.mainRank === 3) {
          if (stats.selfInspectionCount < 20) {
            this.logger.warn(
              `❌ ${name} (P3级别) 自查数量 ${stats.selfInspectionCount} < 20，需扣除绩效`,
            );
            ruleApplied = true;
          }
          if (stats.inspectionByOthersCount < 20) {
            this.logger.warn(
              `❌ ${name} (P3级别) 抽查数量 ${stats.inspectionByOthersCount} < 20，需扣除绩效`,
            );
            ruleApplied = true;
          }
        } else if (stats.mainRank === 4) {
          if (stats.selfInspectionCount < 10) {
            this.logger.warn(
              `❌ ${name} (P4级别) 自查数量 ${stats.selfInspectionCount} < 10，需扣除绩效`,
            );
            ruleApplied = true;
          }
          if (stats.inspectionByOthersCount < 20) {
            this.logger.warn(
              `❌ ${name} (P4级别) 抽查数量 ${stats.inspectionByOthersCount} < 20，需扣除绩效`,
            );
            ruleApplied = true;
          }
        }

        if (!ruleApplied) {
          this.logger.warn(`✅ ${name} 达到绩效要求，无需扣除`);
        }
      });

      // 5. 根据职级和数量调整绩效扣除
      for (const accountant of accountants) {
        const name = accountant.name;
        const stats = accountantStats[name];

        if (!stats) continue;

        // 获取记账会计当月薪资记录
        const salaryRecord = await this.salaryRepository.findOne({
          where: {
            name: name,
            yearMonth: new Date(firstDayOfLastMonth),
          },
        });

        if (!salaryRecord) {
          this.logger.warn(`未找到记账会计${name}的薪资记录，跳过绩效扣除调整`);
          continue;
        }

        // 获取或初始化performanceDeductions数组
        const performanceDeductions = Array.isArray(
          salaryRecord.performanceDeductions,
        )
          ? [...salaryRecord.performanceDeductions]
          : Array(15).fill(0);

        // 确保performanceDeductions数组至少有14个元素
        while (performanceDeductions.length < 14) {
          performanceDeductions.push(0);
        }

        let shouldUpdate = false;

        // 曹海玲的特殊规则
        if (name === '曹海玲') {
          if (stats.reviewCount < 12) {
            performanceDeductions[13] = 0.2;
            shouldUpdate = true;
            this.logger.warn(
              `❌ 曹海玲复查数量(${stats.reviewCount})少于12次，设置绩效扣除为0.2`,
            );
          } else if (performanceDeductions[13] === 0.2) {
            // 如果已经是0.2但现在符合条件，恢复为0
            performanceDeductions[13] = 0;
            shouldUpdate = true;
            this.logger.warn(
              `✅ 曹海玲复查数量(${stats.reviewCount})达标，清除绩效扣除`,
            );
          }
        }
        // 其他记账会计根据职级规则
        else {
          // P2级别规则
          if (stats.mainRank === 2) {
            if (stats.selfInspectionCount < 30) {
              performanceDeductions[13] = 0.2;
              shouldUpdate = true;
              this.logger.warn(
                `❌ ${name} (P2)自查数量(${stats.selfInspectionCount})少于30次，设置绩效扣除为0.2`,
              );
            } else if (performanceDeductions[13] === 0.2) {
              performanceDeductions[13] = 0;
              shouldUpdate = true;
              this.logger.warn(
                `✅ ${name} (P2)自查数量(${stats.selfInspectionCount})达标，清除绩效扣除`,
              );
            }
          }
          // P3级别规则
          else if (stats.mainRank === 3) {
            if (
              stats.selfInspectionCount < 20 ||
              stats.inspectionByOthersCount < 20
            ) {
              performanceDeductions[13] = 0.2;
              shouldUpdate = true;
              this.logger.warn(
                `❌ ${name} (P3)自查数量(${stats.selfInspectionCount})少于20次或抽查数量(${stats.inspectionByOthersCount})少于20次，设置绩效扣除为0.2`,
              );
            } else if (performanceDeductions[13] === 0.2) {
              performanceDeductions[13] = 0;
              shouldUpdate = true;
              this.logger.warn(
                `✅ ${name} (P3)自查和抽查数量达标，清除绩效扣除`,
              );
            }
          }
          // P4级别规则（排除曹海玲）
          else if (stats.mainRank === 4) {
            if (
              stats.selfInspectionCount < 10 ||
              stats.inspectionByOthersCount < 20
            ) {
              performanceDeductions[13] = 0.2;
              shouldUpdate = true;
              this.logger.warn(
                `❌ ${name} (P4)自查数量(${stats.selfInspectionCount})少于10次或抽查数量(${stats.inspectionByOthersCount})少于20次，设置绩效扣除为0.2`,
              );
            } else if (performanceDeductions[13] === 0.2) {
              performanceDeductions[13] = 0;
              shouldUpdate = true;
              this.logger.warn(
                `✅ ${name} (P4)自查和抽查数量达标，清除绩效扣除`,
              );
            }
          }
        }

        // 如果需要更新绩效扣除，则更新数据库
        if (shouldUpdate) {
          // 记录更新前的状态
          this.logger.warn(
            `${name} 更新前: performanceDeductions = [${salaryRecord.performanceDeductions ? salaryRecord.performanceDeductions.join(', ') : ''}], performanceCommission = ${salaryRecord.performanceCommission}`,
          );

          // 计算更新后的绩效佣金
          const newCommission = this.recalculatePerformanceCommission(
            salaryRecord.performanceCommission,
            performanceDeductions,
          );

          // 更新薪资记录的performanceDeductions
          await this.salaryRepository.update(salaryRecord.id, {
            performanceDeductions,
            // 重新计算绩效佣金
            performanceCommission: newCommission,
          });

          // 记录更新后的状态
          this.logger.warn(
            `${name} 更新后: performanceDeductions = [${performanceDeductions.join(', ')}], performanceCommission = ${newCommission}`,
          );
          this.logger.warn(
            `索引位置13的值: ${performanceDeductions[13]} (${performanceDeductions[13] > 0 ? '已扣除' : '无扣除'})`,
          );
        } else {
          this.logger.warn(`${name} 无需更新绩效扣除`);
        }
      }

      this.logger.warn('记账会计绩效扣除检查更新完成');
    } catch (error) {
      this.logger.error(
        `检查记账会计绩效扣除时出错: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 重新计算绩效佣金
   * @param originalCommission 原始绩效佣金
   * @param performanceDeductions 绩效扣除数组
   * @returns 重新计算的绩效佣金
   */
  private recalculatePerformanceCommission(
    originalCommission: number,
    performanceDeductions: number[],
  ): number {
    try {
      // 计算绩效扣除总额
      let performanceDeductionTotal = 0;
      if (Array.isArray(performanceDeductions)) {
        performanceDeductionTotal = performanceDeductions.reduce(
          (sum, deduction) => sum + Number(deduction || 0),
          0,
        );

        // 如果绩效扣除总额大于1，则重置为1
        if (performanceDeductionTotal > 1) {
          performanceDeductionTotal = 1;
        }
      }

      // 计算绩效佣金 = 原始绩效佣金 * (1 - 绩效扣除总额)
      return Number(originalCommission || 0) * (1 - performanceDeductionTotal);
    } catch (error) {
      this.logger.error(
        `重新计算绩效佣金时出错: ${error.message}`,
        error.stack,
      );
      return originalCommission;
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

    // 检查时间限制：不能生成2025年6月及其之前的薪资数据
    const restrictedDate = moment('2025-06-30'); // 2025年6月30日
    if (lastMonth.isSameOrBefore(restrictedDate)) {
      const errorMessage = `不能生成2025年6月及其之前的薪资数据。尝试生成的月份：${lastMonth.format('YYYY-MM')}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // 获取提成计算的时间范围：上个月1号到最后一天
    // chargeDate字段为日期格式，直接使用YYYY-MM-DD格式比较
    
    // 计算上个月的日期范围
    const commissionStartDate = lastMonth.clone().date(1).format('YYYY-MM-DD'); // 上个月1号
    const commissionEndDate = lastMonth.clone().endOf('month').format('YYYY-MM-DD'); // 上个月最后一天

    this.logger.log(
      `生成${commissionStartDate}至${commissionEndDate}期间的薪资数据`,
    );

    // 先检查和更新记账会计绩效扣除
    await this.checkAndUpdateAccountantPerformance(lastMonth);

    // 第一步：清空指定日期范围内费用记录的提成字段
    this.logger.log(
      `开始清空${commissionStartDate}至${commissionEndDate}期间费用记录的提成字段`,
    );
    await this.clearExpenseCommissionFields(commissionStartDate, commissionEndDate);

    // 直接使用dataSource.query执行原生SQL查询
    // 获取所有员工
    const employees = await this.dataSource.query(`
      SELECT * FROM sys_employees
    `);

    // 获取所有保证金数据，以便后续匹配 - 使用月份匹配
    const targetYearMonth = lastMonth.format('YYYY-MM');
    this.logger.log(
      `获取${targetYearMonth}月份的保证金数据`,
    );
    const depositRecords = await this.dataSource.query(
      `
      SELECT * FROM sys_deposit
      WHERE DATE_FORMAT(deductionDate, '%Y-%m') = ?
    `,
      [targetYearMonth],
    );

    // 创建员工姓名到保证金金额的映射表
    const depositMap = new Map<string, number>();
    depositRecords.forEach((record) => {
      depositMap.set(record.name, Number(record.amount) || 0);
      this.logger.debug(`员工 ${record.name} 保证金: ${record.amount}`);
    });
    this.logger.log(`找到${depositRecords.length}条保证金记录`);

    let created = 0;
    let updated = 0;

    for (const employee of employees) {
      try {
        // 查询是否已存在当月薪资记录
        // 使用lastMonth的第一天作为yearMonth，而不是commissionStartDate
        const salaryYearMonth = lastMonth.clone().startOf('month').toDate();
        const existingSalary = await this.salaryRepository.findOne({
          where: {
            name: employee.name,
            yearMonth: salaryYearMonth,
          },
        });

        // 获取员工部门信息
        const departments = await this.dataSource.query(
          `
          SELECT * FROM sys_department WHERE id = ?
        `,
          [employee.departmentId],
        );
        const department = departments.length > 0 ? departments[0] : null;

        // 获取考勤扣款信息 - 使用月份匹配而非日期范围
        const targetYearMonth = lastMonth.format('YYYY-MM');
        const attendanceDeductions = await this.dataSource.query(
          `
          SELECT * FROM sys_attendance_deduction 
          WHERE name = ? 
          AND DATE_FORMAT(yearMonth, '%Y-%m') = ?
          LIMIT 1
        `,
          [employee.name, targetYearMonth],
        );
        const attendanceDeduction =
          attendanceDeductions.length > 0 ? attendanceDeductions[0] : null;

        // 获取补贴汇总信息 - 使用月份匹配而非日期范围
        const subsidySummaries = await this.dataSource.query(
          `
          SELECT * FROM sys_subsidy_summary 
          WHERE name = ? 
          AND DATE_FORMAT(yearMonth, '%Y-%m') = ?
          LIMIT 1
        `,
          [employee.name, targetYearMonth],
        );
        const subsidySummary =
          subsidySummaries.length > 0 ? subsidySummaries[0] : null;

        // 获取朋友圈奖励信息 - 使用月份匹配而非日期范围
        const friendCirclePayments = await this.dataSource.query(
          `
          SELECT * FROM sys_friend_circle_payment 
          WHERE name = ? 
          AND DATE_FORMAT(yearMonth, '%Y-%m') = ?
          LIMIT 1
        `,
          [employee.name, targetYearMonth],
        );
        const friendCirclePayment =
          friendCirclePayments.length > 0 ? friendCirclePayments[0] : null;

        // 获取社保信息 - 使用月份匹配而非日期范围
        const socialInsurances = await this.dataSource.query(
          `
          SELECT * FROM sys_social_insurance 
          WHERE name = ? 
          AND DATE_FORMAT(yearMonth, '%Y-%m') = ?
          LIMIT 1
        `,
          [employee.name, targetYearMonth],
        );
        const socialInsurance =
          socialInsurances.length > 0 ? socialInsurances[0] : null;

        // 计算代理费提成
        const agencyFeeCommission = await this.calculateAgencyFeeCommission(
          employee.name,
          commissionStartDate,
          commissionEndDate,
        );

        // 更新费用记录的代理费提成
        await this.updateExpenseAgencyCommission(
          employee.name,
          commissionStartDate,
          commissionEndDate,
        );

        // 计算业务提成
        const businessCommissionResult = await this.calculateBusinessCommission(
          employee.name,
          commissionStartDate,
          commissionEndDate,
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
              const performanceCommissionResults = await this.dataSource.query(
                `
                SELECT * FROM sys_performance_commission 
                WHERE pLevel = ? AND gradeLevel = ? 
                LIMIT 1
              `,
                [pLevel, gradeLevel],
              );

              if (performanceCommissionResults.length > 0) {
                performanceCommission = Number(
                  performanceCommissionResults[0].performance || 0,
                );
                this.logger.debug(
                  `员工 ${employee.name} 匹配到绩效: ${performanceCommission}`,
                );
              }
            } catch (error) {
              this.logger.error(
                `查询员工 ${employee.name} 的绩效提成记录出错: ${error.message}`,
                error.stack,
              );
            }
          }
        }

        // 获取保证金扣除金额
        const depositDeduction = depositMap.has(employee.name)
          ? depositMap.get(employee.name)
          : existingSalary?.depositDeduction || 0;

        // 如果找到了保证金记录，记录日志
        if (depositMap.has(employee.name)) {
          this.logger.debug(
            `员工 ${employee.name} 匹配到保证金扣除金额: ${depositDeduction}`,
          );
        }

        // 准备薪资数据
        const salaryData: any = {
          name: employee.name,
          department: department ? department.name : '未分配',
          idCard: employee.idCardNumber || '',
          type: employee.employeeType || '未设置',
          // 如果是销售且计算出新的基本工资，则使用新值，否则使用员工表中的值
          baseSalary:
            businessCommissionResult.newBaseSalary !== null &&
            businessCommissionResult.newBaseSalary !== undefined
              ? businessCommissionResult.newBaseSalary
              : employee.baseSalary || 0,
          temporaryIncrease: existingSalary?.temporaryIncrease || 0,
          temporaryIncreaseItem: existingSalary?.temporaryIncreaseItem || '',
          attendanceDeduction: attendanceDeduction?.attendanceDeduction || existingSalary?.attendanceDeduction || 0,
          fullAttendance: attendanceDeduction?.fullAttendanceBonus || existingSalary?.fullAttendance || 0,
          departmentHeadSubsidy: subsidySummary?.departmentHeadSubsidy || existingSalary?.departmentHeadSubsidy || 0,
          positionAllowance: subsidySummary?.positionAllowance || existingSalary?.positionAllowance || 0,
          oilSubsidy: subsidySummary?.oilSubsidy || existingSalary?.oilSubsidy || 0,
          mealSubsidy: subsidySummary?.mealSubsidy || existingSalary?.mealSubsidy || 0,
          seniority: (employee.workYears || 0) * 100,
          agencyFeeCommission: agencyFeeCommission,
          performanceCommission: performanceCommission,
          performanceDeductions: existingSalary?.performanceDeductions || [],
          businessCommission: businessCommissionResult.businessCommission,
          otherDeductions: friendCirclePayment?.payment || existingSalary?.otherDeductions || 0,
          personalMedical: socialInsurance?.personalMedical || existingSalary?.personalMedical || 0,
          personalPension: socialInsurance?.personalPension || existingSalary?.personalPension || 0,
          personalUnemployment: socialInsurance?.personalUnemployment || existingSalary?.personalUnemployment || 0,
          personalInsuranceTotal: socialInsurance?.personalTotal || existingSalary?.personalInsuranceTotal || 0,
          companyInsuranceTotal: socialInsurance?.companyTotal || existingSalary?.companyInsuranceTotal || 0,
          depositDeduction: depositDeduction || existingSalary?.depositDeduction || 0,
          personalIncomeTax: existingSalary?.personalIncomeTax || 0,
          other: existingSalary?.other || 0,
          bankCardNumber: employee.bankCardNumber || '',
          // company: existingSalary?.company || '', // 注意：company字段已从数据库中删除，改用员工表中的payrollCompany字段
          bankCardOrWechat: existingSalary?.bankCardOrWechat || 0,
          cashPaid: existingSalary?.cashPaid || 0,
          yearMonth: salaryYearMonth, // 使用统一的薪资年月
        };

        // 使用calculateDerivedFields方法计算所有衍生字段，包括绩效佣金
        const processedSalaryData = this.calculateDerivedFields(salaryData);

        if (existingSalary) {
          // 更新现有记录
          await this.salaryRepository.update(
            existingSalary.id,
            processedSalaryData,
          );
          updated++;
          this.logger.debug(`更新员工 ${employee.name} 的薪资记录`);
        } else {
          // 创建新记录
          await this.salaryRepository.save(processedSalaryData);
          created++;
          this.logger.debug(`创建员工 ${employee.name} 的薪资记录`);
        }

        // 如果是销售且有新的基本工资，更新员工表中的基本工资
        if (
          businessCommissionResult.newBaseSalary !== null &&
          businessCommissionResult.newBaseSalary !== undefined
        ) {
          await this.dataSource.query(
            `
            UPDATE sys_employees SET baseSalary = ? WHERE name = ?
          `,
            [businessCommissionResult.newBaseSalary, employee.name],
          );
          this.logger.log(
            `更新员工 ${employee.name} 的基本工资为 ${businessCommissionResult.newBaseSalary}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `处理员工 ${employee.name} 薪资时出错: ${error.message}`,
          error.stack,
        );
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
        details: result,
      };
    } catch (error) {
      this.logger.error(`手动生成薪资数据失败: ${error.message}`, error.stack);

      // 检查是否是时间限制错误
      if (
        error.message &&
        error.message.includes('不能生成2025年6月及其之前的薪资数据')
      ) {
        return {
          success: false,
          message: error.message,
          error: 'TIME_RESTRICTION',
        };
      }

      return {
        success: false,
        message: `薪资数据生成失败: ${error.message}`,
      };
    }
  }
}
