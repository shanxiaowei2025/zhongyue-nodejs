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
  ): Promise<ExpenseSummaryDto> {
    // 构建查询条件
    const whereCondition = [];
    
    if (companyName) {
      whereCondition.push({ companyName });
    }
    
    if (unifiedSocialCreditCode) {
      whereCondition.push({ unifiedSocialCreditCode });
    }

    // 查询数据库
    const expenses = await this.expenseRepository.find({
      where: whereCondition,
      select: ['id', 'chargeDate', 'receiptNo', 'totalFee'],
      order: { chargeDate: 'DESC' },
    });

    // 计算总费用
    const totalAmount = expenses.reduce((sum, expense) => {
      // 确保将totalFee转换为数字类型再进行加法运算
      const feeAmount = expense.totalFee ? parseFloat(expense.totalFee.toString()) : 0;
      return sum + feeAmount;
    }, 0);

    // 构建返回数据
    const expenseItems: ExpenseItemDto[] = expenses.map(expense => ({
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