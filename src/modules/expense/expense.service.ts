import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere, Not, IsNull } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ExpensePermissionService } from './services/expense-permission.service';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly expensePermissionService: ExpensePermissionService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, username: string) {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      submitter: username,
    });
    return await this.expenseRepository.save(expense);
  }

  async findAll(query: any, pagination: PaginationDto, userId: number) {
    const { page = 1, pageSize = 10 } = pagination;
    const skip = (page - 1) * pageSize;

    // 获取权限过滤条件
    const permissionFilter = await this.expensePermissionService.buildExpenseQueryFilter(userId);
    const where: FindOptionsWhere<Expense> | FindOptionsWhere<Expense>[] = Array.isArray(permissionFilter)
      ? permissionFilter.map(filter => ({ ...filter }))
      : { ...permissionFilter };

    // 处理查询条件
    const addConditions = (conditions: any) => {
      if (query.companyName) {
        conditions.companyName = Like(`%${query.companyName}%`);
      }
      if (query.companyType) {
        conditions.companyType = query.companyType;
      }
      if (query.companyLocation) {
        conditions.companyLocation = query.companyLocation;
      }
      if (query.businessType) {
        conditions.businessType = query.businessType;
      }
      if (query.status !== undefined) {
        conditions.status = query.status;
      }
      if (query.submitter) {
        conditions.submitter = query.submitter;
      }
      if (query.startDate && query.endDate) {
        conditions.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
      }
    };

    // 根据权限过滤条件类型添加查询条件
    if (Array.isArray(where)) {
      where.forEach(condition => addConditions(condition));
    } else {
      addConditions(where);
    }

    const [expenses, total] = await this.expenseRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: {
        id: 'DESC',
      },
    });

    return {
      list: expenses,
      total,
      currentPage: page,
      pageSize,
    };
  }

  async findOne(id: number, userId: number) {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`费用记录 #${id} 不存在`);
    }

    // 检查用户是否有权限查看该记录
    const permissionFilter = await this.expensePermissionService.buildExpenseQueryFilter(userId);
    const hasPermission = Array.isArray(permissionFilter)
      ? permissionFilter.some(filter => this.matchesFilter(expense, filter))
      : this.matchesFilter(expense, permissionFilter);

    if (!hasPermission) {
      throw new BadRequestException('没有权限查看该费用记录');
    }

    return expense;
  }

  private matchesFilter(expense: Expense, filter: any): boolean {
    if (!filter || Object.keys(filter).length === 0) {
      return true;
    }
    return Object.entries(filter).every(([key, value]) => expense[key] === value);
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto, userId: number) {
    const expense = await this.findOne(id, userId);
    
    // 检查用户是否有编辑权限
    const hasEditPermission = await this.expensePermissionService.hasExpenseEditPermission(userId);
    if (!hasEditPermission) {
      throw new BadRequestException('没有权限编辑费用记录');
    }

    const updated = Object.assign(expense, updateExpenseDto);
    return await this.expenseRepository.save(updated);
  }

  async remove(id: number, userId: number) {
    const expense = await this.findOne(id, userId);
    
    // 检查用户是否有编辑权限
    const hasEditPermission = await this.expensePermissionService.hasExpenseEditPermission(userId);
    if (!hasEditPermission) {
      throw new BadRequestException('没有权限删除费用记录');
    }

    return await this.expenseRepository.remove(expense);
  }

  async audit(id: number, userId: number, auditor: string, status: number, rejectReason?: string) {
    const expense = await this.findOne(id, userId);
    
    // 检查用户是否有审核权限
    const hasAuditPermission = await this.expensePermissionService.hasExpenseAuditPermission(userId);
    if (!hasAuditPermission) {
      throw new BadRequestException('没有权限审核费用记录');
    }

    if (expense.status === 1) {
      throw new BadRequestException('该费用记录已审核通过，不能重复审核');
    }

    expense.auditor = auditor;
    expense.status = status;
    expense.auditDate = new Date();
    
    if (status === 2 && !rejectReason) {
      throw new BadRequestException('拒绝时必须提供拒绝原因');
    }
    
    if (rejectReason) {
      expense.rejectReason = rejectReason;
    }

    return await this.expenseRepository.save(expense);
  }

  async cancelAudit(id: number, userId: number, username: string, cancelReason: string) {
    const expense = await this.findOne(id, userId);
    
    // 检查用户是否有审核权限
    const hasAuditPermission = await this.expensePermissionService.hasExpenseAuditPermission(userId);
    if (!hasAuditPermission) {
      throw new BadRequestException('没有权限取消审核费用记录');
    }
    
    if (expense.status === 0) {
      throw new BadRequestException('该费用记录未审核，不能取消审核');
    }

    // 更新费用记录状态
    expense.status = 0;
    expense.auditor = null;
    expense.auditDate = null;
    expense.rejectReason = null;
  

    return await this.expenseRepository.save(expense);
  }

  // 添加新的查看收据方法
  async viewReceipt(id: number, userId: number) {
    const expense = await this.findOne(id, userId);
    
    // 检查用户是否有查看收据权限
    const hasViewReceiptPermission = await this.expensePermissionService.hasExpenseViewReceiptPermission(userId);
    if (!hasViewReceiptPermission) {
      throw new BadRequestException('没有权限查看收据');
    }

    if (expense.status !== 1) {
      throw new BadRequestException('只能查看已审核通过的费用记录的收据');
    }

    return {
      id: expense.id,
      companyName: expense.companyName,
      chargeDate: expense.chargeDate,
      totalFee: expense.totalFee,
      chargeMethod: expense.chargeMethod,
      remarks: expense.remarks
    };
  }

  async getAutocompleteOptions(field: string) {
    // 验证字段名是否合法
    const allowedFields = ['companyName', 'companyType', 'companyLocation', 'businessType', 'submitter'];
    if (!allowedFields.includes(field)) {
      throw new BadRequestException(`不支持的字段名: ${field}`);
    }

    // 获取去重后的字段值列表
    const values = await this.expenseRepository
      .createQueryBuilder('expense')
      .select(`DISTINCT expense.${field}`, field)
      .where(`expense.${field} IS NOT NULL`)
      .orderBy(`expense.${field}`, 'ASC')
      .getRawMany();

    // 提取字段值并返回
    return values.map(item => item[field]);
  }
} 