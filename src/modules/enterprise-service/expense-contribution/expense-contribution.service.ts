import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../expense/entities/expense.entity';
import { ExpenseSummaryDto, ExpenseItemDto } from './dto/expense-summary.dto';

@Injectable()
export class ExpenseContributionService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  /**
   * 根据企业名称或统一社会信用代码查询费用记录
   */
  async findExpensesByCompany(
    companyName?: string,
    unifiedSocialCreditCode?: string,
    year?: string,
  ): Promise<ExpenseSummaryDto> {
    // 使用QueryBuilder构建查询
    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .select([
        'expense.id',
        'expense.chargeDate',
        'expense.receiptNo',
        'expense.totalFee',
      ]);

    // 添加企业查询条件
    let hasWhereCondition = false;

    if (companyName) {
      queryBuilder.where('expense.companyName = :companyName', { companyName });
      hasWhereCondition = true;
    }

    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('expense.unifiedSocialCreditCode = :unifiedSocialCreditCode', {
          unifiedSocialCreditCode,
        });
      } else {
        queryBuilder.where('expense.unifiedSocialCreditCode = :unifiedSocialCreditCode', {
          unifiedSocialCreditCode,
        });
        hasWhereCondition = true;
      }
    }

    // 添加年份筛选条件
    if (year) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('YEAR(expense.chargeDate) = :year', { year: parseInt(year) });
      } else {
        queryBuilder.where('YEAR(expense.chargeDate) = :year', { year: parseInt(year) });
      }
    }

    // 排序
    queryBuilder.orderBy('expense.chargeDate', 'DESC');

    // 执行查询
    const expenses = await queryBuilder.getMany();

    // 计算总费用
    const totalAmount = expenses.reduce((sum, expense) => {
      // 确保将totalFee转换为数字类型再进行加法运算
      const feeAmount = expense.totalFee
        ? parseFloat(expense.totalFee.toString())
        : 0;
      return sum + feeAmount;
    }, 0);

    // 构建返回数据
    const expenseItems: ExpenseItemDto[] = expenses.map((expense) => ({
      id: expense.id,
      chargeDate: expense.chargeDate,
      receiptNo: expense.receiptNo || '',
      totalFee: expense.totalFee || 0,
    }));

    return {
      expenses: expenseItems,
      totalAmount,
    };
  }
}
