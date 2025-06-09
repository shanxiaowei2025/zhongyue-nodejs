import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere, Not, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ExpensePermissionService } from './services/expense-permission.service';
import { Parser } from 'json2csv';
import { ExportExpenseDto } from './dto/export-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly expensePermissionService: ExpensePermissionService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, username: string) {
    // 添加调试信息
    console.log('收到的relatedContract数据:', JSON.stringify(createExpenseDto.relatedContract));
    
    // 确保relatedContract是正确的格式
    if (createExpenseDto.relatedContract) {
      // 确保数据是数组格式
      if (!Array.isArray(createExpenseDto.relatedContract)) {
        console.error('relatedContract不是数组格式');
        createExpenseDto.relatedContract = [];
      } else {
        // 确保每个元素都是正确的对象格式
        createExpenseDto.relatedContract = createExpenseDto.relatedContract.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id,
              contractNumber: item.contractNumber
            };
          } else {
            console.error('无效的relatedContract项:', item);
            return null;
          }
        }).filter(item => item !== null);
      }
      console.log('处理后的relatedContract数据:', JSON.stringify(createExpenseDto.relatedContract));
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      salesperson: username,
    });

    // 如果有收费日期，则生成收据编号
    if (expense.chargeDate) {
      try {
        expense.receiptNo = await this.generateReceiptNo(expense.chargeDate);
      } catch (error) {
        console.error('生成收据编号出错:', error);
      }
    }

    const savedExpense = await this.expenseRepository.save(expense);
    
    // 添加调试信息
    console.log('保存后的relatedContract数据:', JSON.stringify(savedExpense.relatedContract));
    
    return savedExpense;
  }

  // 生成收据编号的辅助方法
  private async generateReceiptNo(chargeDate: string | Date): Promise<string> {
    if (!chargeDate) {
      throw new Error('收费日期不能为空');
    }
    
    // 格式化日期为YYYYMMDD
    // 确保日期格式正确
    let datePart: string;
    if (typeof chargeDate === 'string') {
      // 如果是字符串，直接去除短横线
      datePart = chargeDate.replace(/-/g, '');
    } else if (chargeDate instanceof Date) {
      // 如果是Date对象，格式化为YYYYMMDD
      datePart = chargeDate.toISOString().slice(0, 10).replace(/-/g, '');
    } else {
      throw new Error(`无效的日期格式: ${chargeDate}`);
    }
    
    // 确保得到的datePart是8位数字
    if (!/^\d{8}$/.test(datePart)) {
      throw new Error(`日期格式不正确: ${chargeDate}, 格式化结果: ${datePart}`);
    }
    
    console.log('生成收据编号 - 日期部分:', datePart);
    
    // 查询当天最大的收据编号
    const query = `
      SELECT receiptNo 
      FROM sys_expense 
      WHERE chargeDate = ? 
      AND receiptNo IS NOT NULL 
      AND receiptNo LIKE '${datePart}%'
      ORDER BY receiptNo DESC 
      LIMIT 1
    `;
    
    console.log('执行查询:', query, '参数:', chargeDate);
    const result = await this.expenseRepository.query(query, [chargeDate]);
    console.log('查询结果:', result);
    
    let sequenceNumber = 1;
    if (result && result.length > 0 && result[0].receiptNo) {
      // 提取序列号部分并加1
      const lastReceiptNo = result[0].receiptNo;
      console.log('找到最后的收据编号:', lastReceiptNo);
      
      // 确保receiptNo至少有9个字符（8位日期+至少1位序号）
      if (lastReceiptNo.length >= 9) {
        const lastNumber = parseInt(lastReceiptNo.substring(8), 10);
        if (!isNaN(lastNumber)) {
          sequenceNumber = lastNumber + 1;
          console.log('新序列号:', sequenceNumber);
        } else {
          console.error('无法解析序列号部分:', lastReceiptNo.substring(8));
        }
      } else {
        console.error('收据编号格式不正确:', lastReceiptNo);
      }
    } else {
      console.log('没有找到现有收据编号，使用序列号1');
    }
    
    // 格式化序列号为4位
    const sequencePart = String(sequenceNumber).padStart(4, '0');
    
    const receiptNo = `${datePart}${sequencePart}`;
    console.log('生成的完整收据编号:', receiptNo);
    
    return receiptNo;
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
      // 对所有字符串字段使用模糊查询
      if (query.companyName) {
        conditions.companyName = Like(`%${query.companyName}%`);
      }
      if (query.unifiedSocialCreditCode) {
        conditions.unifiedSocialCreditCode = Like(`%${query.unifiedSocialCreditCode}%`);
      }
      if (query.companyType) {
        conditions.companyType = Like(`%${query.companyType}%`);
      }
      if (query.companyLocation) {
        conditions.companyLocation = Like(`%${query.companyLocation}%`);
      }
      if (query.businessType) {
        conditions.businessType = Like(`%${query.businessType}%`);
      }
      if (query.status !== undefined) {
        conditions.status = query.status;
      }
      if (query.salesperson) {
        conditions.salesperson = Like(`%${query.salesperson}%`);
      }
      // 添加对其他可能的字符串字段的模糊查询
      if (query.paymentMethod) {
        conditions.paymentMethod = Like(`%${query.paymentMethod}%`);
      }
      if (query.remarks) {
        conditions.remarks = Like(`%${query.remarks}%`);
      }
      if (query.servicePeriod) {
        conditions.servicePeriod = Like(`%${query.servicePeriod}%`);
      }
      if (query.receiptNo) {
        conditions.receiptNo = Like(`%${query.receiptNo}%`);
      }
      if (query.auditor) {
        conditions.auditor = Like(`%${query.auditor}%`);
      }
      if (query.payee) {
        conditions.payee = Like(`%${query.payee}%`);
      }
      
      if (query.chargeDateStart && query.chargeDateEnd) {
        conditions.chargeDate = Between(query.chargeDateStart, query.chargeDateEnd);
      } else if (query.chargeDateStart) {
        conditions.chargeDate = MoreThanOrEqual(query.chargeDateStart);
      } else if (query.chargeDateEnd) {
        conditions.chargeDate = LessThanOrEqual(query.chargeDateEnd);
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

  async update(id: number, updateExpenseDto: UpdateExpenseDto, userId: number, username: string) {
    const expense = await this.findOne(id, userId);
    
    // 检查是否有权限编辑
    // 1. 有费用编辑权限的用户可以编辑
    // 2. 或者是被退回状态(status=2)下的原业务员可以编辑
    let hasEditPermission = await this.expensePermissionService.hasExpenseEditPermission(userId);
    
    // 如果是退回状态且当前用户是原业务员，也赋予编辑权限
    if (!hasEditPermission && expense.status === 2 && expense.salesperson === username) {
      hasEditPermission = true;
    }
    
    if (!hasEditPermission) {
      throw new BadRequestException('没有权限编辑费用记录');
    }

    // 添加调试信息
    console.log('更新前的relatedContract数据:', JSON.stringify(expense.relatedContract));
    console.log('更新请求中的relatedContract数据:', JSON.stringify(updateExpenseDto.relatedContract));
    
    // 确保relatedContract是正确的格式
    if (updateExpenseDto.relatedContract) {
      // 确保数据是数组格式
      if (!Array.isArray(updateExpenseDto.relatedContract)) {
        console.error('relatedContract不是数组格式');
        updateExpenseDto.relatedContract = [];
      } else {
        // 确保每个元素都是正确的对象格式
        updateExpenseDto.relatedContract = updateExpenseDto.relatedContract.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id,
              contractNumber: item.contractNumber
            };
          } else {
            console.error('无效的relatedContract项:', item);
            return null;
          }
        }).filter(item => item !== null);
      }
      console.log('处理后的relatedContract数据:', JSON.stringify(updateExpenseDto.relatedContract));
    }

    // 检查收费日期是否有变更
    let needUpdateReceiptNo = false;
    
    if (updateExpenseDto.chargeDate !== undefined) {
      // 确保两个日期的格式一致后再比较
      const oldDateStr = expense.chargeDate ? expense.chargeDate.toString().split('T')[0] : '';
      const newDateStr = updateExpenseDto.chargeDate ? updateExpenseDto.chargeDate.toString().split('T')[0] : '';
      
      needUpdateReceiptNo = oldDateStr !== newDateStr;
    }

    const updated = Object.assign(expense, updateExpenseDto);
    
    // 如果收费日期变更，重新生成收据编号
    if (needUpdateReceiptNo && updated.chargeDate) {
      try {
        updated.receiptNo = await this.generateReceiptNo(updated.chargeDate);
      } catch (error) {
        console.error('更新收据编号时出错:', error);
      }
    }
    
    // 如果是退回状态且业务员编辑，则重置为待审核状态
    if (expense.status === 2 && expense.salesperson === username) {
      updated.status = 0; // 重新设置为未审核状态
      updated.auditor = null;
      updated.auditDate = null;
      updated.rejectReason = null; // 清除退回原因
    }
    
    const savedExpense = await this.expenseRepository.save(updated);
    
    // 添加调试信息
    console.log('更新后的relatedContract数据:', JSON.stringify(savedExpense.relatedContract));
    
    return savedExpense;
  }

  async remove(id: number, userId: number) {
    const expense = await this.findOne(id, userId);
    
    // 检查用户是否有编辑权限
    const hasEditPermission = await this.expensePermissionService.hasExpenseDeletePermission(userId);
    if (!hasEditPermission) {
      throw new BadRequestException('没有权限删除费用记录');
    }

    return await this.expenseRepository.remove(expense);
  }

  async audit(id: number, userId: number, auditor: string, status: number, reason?: string) {
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
    
    // 当状态为退回(2)时必须提供原因
    if (status === 2 && !reason) {
      throw new BadRequestException('退回时必须提供退回原因');
    }
    
    if (reason) {
      // 继续使用 rejectReason 字段，但含义变为"退回原因"
      expense.rejectReason = reason;
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

    // 收集所有非零费用字段
    const feeItems = [];
    
    // 费用字段映射 - 包含名称、金额字段、开始日期字段和结束日期字段
    const feeFieldsMap = [
      { name: '办照费用', amountField: 'licenseFee' },
      { name: '牌子费', amountField: 'brandFee' },
      { name: '备案章费用', amountField: 'recordSealFee' },
      { name: '一般刻章费用', amountField: 'generalSealFee' },
      { 
        name: '代理费', 
        amountField: 'agencyFee',
        startDateField: 'agencyStartDate',
        endDateField: 'agencyEndDate'
      },
      { 
        name: '记账软件费', 
        amountField: 'accountingSoftwareFee',
        startDateField: 'accountingSoftwareStartDate',
        endDateField: 'accountingSoftwareEndDate'
      },
      { 
        name: '地址费', 
        amountField: 'addressFee',
        startDateField: 'addressStartDate',
        endDateField: 'addressEndDate'
      },
      { 
        name: '开票软件费', 
        amountField: 'invoiceSoftwareFee',
        startDateField: 'invoiceSoftwareStartDate',
        endDateField: 'invoiceSoftwareEndDate'
      },
      { 
        name: '社保代理费', 
        amountField: 'socialInsuranceAgencyFee',
        startDateField: 'socialInsuranceStartDate',
        endDateField: 'socialInsuranceEndDate',
        listField: 'insuranceTypes'
      },
      { 
        name: '公积金代理费', 
        amountField: 'housingFundAgencyFee',
        startDateField: 'housingFundStartDate',
        endDateField: 'housingFundEndDate'
      },
      { 
        name: '统计局报表费', 
        amountField: 'statisticalReportFee',
        startDateField: 'statisticalStartDate',
        endDateField: 'statisticalEndDate'
      },
      // 特殊处理的三个字段，需要与数组内容合并显示
      { 
        name: '变更收费', 
        amountField: 'changeFee',
        listField: 'changeBusiness'
      },
      { 
        name: '行政许可收费', 
        amountField: 'administrativeLicenseFee',
        listField: 'administrativeLicense'
      },
      { 
        name: '其他业务收费', 
        amountField: 'otherBusinessFee',
        listField: 'otherBusiness'
      }
    ];

    // 遍历费用字段，找出非零正数的费用
    for (const field of feeFieldsMap) {
      if (expense[field.amountField] && expense[field.amountField] > 0) {
        let feeName = field.name;
        
        // 特殊处理三个业务字段，将数组内容合并到名称中
        if (field.listField && expense[field.listField] && expense[field.listField].length > 0) {
          feeName = `${field.name}(${expense[field.listField].join(', ')})`;
        }
        
        const feeItem: any = {
          name: feeName,
          amount: expense[field.amountField]
        };
        
        // 如果存在日期字段，添加到返回数据中
        if (field.startDateField && expense[field.startDateField]) {
          feeItem.startDate = expense[field.startDateField];
        }
        
        if (field.endDateField && expense[field.endDateField]) {
          feeItem.endDate = expense[field.endDateField];
        }
        
        feeItems.push(feeItem);
      }
    }

    return {
      id: expense.id,
      companyName: expense.companyName,
      chargeDate: expense.chargeDate,
      // 根据审核状态决定是否返回收据编号
      receiptNo: expense.status === 1 ? expense.receiptNo : '',
      totalFee: expense.totalFee,
      chargeMethod: expense.chargeMethod,
      remarks: expense.receiptRemarks,
      feeItems
    };
  }

  async getAutocompleteOptions(field: string) {
    const allowedFields = ['companyName', 'companyType', 'companyLocation', 'businessType', 'salesperson'];
    
    if (!allowedFields.includes(field)) {
      throw new BadRequestException(`不支持的字段: ${field}`);
    }
    
    // 获取字段的唯一值
    const query = `SELECT DISTINCT ${field} FROM sys_expense WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`;
    const results = await this.expenseRepository.query(query);
    
    // 提取字段值
    return results.map(item => item[field]);
  }

  async exportToCsv(query: ExportExpenseDto, userId: number): Promise<string> {
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
      if (query.unifiedSocialCreditCode) {
        conditions.unifiedSocialCreditCode = Like(`%${query.unifiedSocialCreditCode}%`);
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
      if (query.salesperson) {
        conditions.salesperson = query.salesperson;
      }
      if (query.chargeDateStart && query.chargeDateEnd) {
        conditions.chargeDate = Between(query.chargeDateStart, query.chargeDateEnd);
      } else if (query.chargeDateStart) {
        conditions.chargeDate = MoreThanOrEqual(query.chargeDateStart);
      } else if (query.chargeDateEnd) {
        conditions.chargeDate = LessThanOrEqual(query.chargeDateEnd);
      }
    };

    // 根据权限过滤条件类型添加查询条件
    if (Array.isArray(where)) {
      where.forEach(condition => addConditions(condition));
    } else {
      addConditions(where);
    }

    // 查询数据
    const expenses = await this.expenseRepository.find({
      where,
      order: {
        id: 'DESC',
      },
    });

    // 定义CSV字段映射
    const fieldMapping = {
      // 移除ID字段
      // id: 'ID',
      companyName: '企业名称',
      unifiedSocialCreditCode: '统一社会信用代码',
      companyType: '企业类型',
      companyLocation: '企业归属地',
      licenseType: '办照类型',
      licenseFee: '办照费用',
      brandFee: '牌子费',
      recordSealFee: '备案章费用',
      generalSealFee: '一般刻章费用',
      agencyType: '代理类型',
      agencyFee: '代理费',
      accountingSoftwareFee: '记账软件费',
      accountingSoftwareStartDate: '记账软件开始日期',
      accountingSoftwareEndDate: '记账软件结束日期',
      addressFee: '地址费',
      addressStartDate: '地址费开始日期',
      addressEndDate: '地址费结束日期',
      agencyStartDate: '代理开始日期',
      agencyEndDate: '代理结束日期',
      businessType: '业务类型',
      contractType: '合同类型',
      contractImage: '合同图片',
      invoiceSoftwareFee: '开票软件费',
      invoiceSoftwareStartDate: '开票软件开始日期',
      invoiceSoftwareEndDate: '开票软件结束日期',
      insuranceTypes: '参保险种',
      insuredCount: '参保人数',
      socialInsuranceAgencyFee: '社保代理费',
      socialInsuranceStartDate: '社保开始日期',
      socialInsuranceEndDate: '社保结束日期',
      hasHousingFund: '是否有公积金',
      housingFundCount: '公积金人数',
      housingFundAgencyFee: '公积金代理费',
      housingFundStartDate: '公积金开始日期',
      housingFundEndDate: '公积金结束日期',
      statisticalReportFee: '统计局报表费',
      statisticalStartDate: '统计开始日期',
      statisticalEndDate: '统计结束日期',
      changeBusiness: '变更业务',
      changeFee: '变更收费',
      administrativeLicense: '行政许可',
      administrativeLicenseFee: '行政许可收费',
      otherBusiness: '其他业务',
      otherBusinessFee: '其他业务收费',
      totalFee: '总费用',
      salesperson: '业务员',
      chargeDate: '收费日期',
      chargeMethod: '收费方式',
      status: '状态',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      auditor: '审核员',
      auditDate: '审核日期',
      rejectReason: '退回原因',
      receiptRemarks: '收据备注',
      internalRemarks: '内部备注'
    };

    // 处理导出数据
    const exportData = expenses.map(expense => {
      // 使用any类型来避免类型错误
      const item: any = { ...expense };
      
      // 移除ID字段
      delete item.id;
      
      // 处理状态显示
      if (item.status === 0) {
        item.status = '未审核';
      } else if (item.status === 1) {
        item.status = '已审核';
      } else if (item.status === 2) {
        item.status = '已退回';
      }
      
      // 处理数组类型的收费凭证
      if (item.proofOfCharge) {
        try {
          item.proofOfCharge = Array.isArray(item.proofOfCharge) 
            ? item.proofOfCharge.join(',') 
            : JSON.stringify(item.proofOfCharge);
        } catch (e) {
          item.proofOfCharge = ''; // 处理无法转换的情况
        }
      }
      
      // 处理字符串数组类型字段
      ['insuranceTypes', 'changeBusiness', 'administrativeLicense', 'otherBusiness'].forEach(field => {
        if (item[field] && Array.isArray(item[field])) {
          item[field] = item[field].join(',');
        }
      });
      
      return item;
    });

    // 创建字段标题
    const fields = Object.keys(fieldMapping).map(field => ({
      label: fieldMapping[field],
      value: field
    }));

    // 使用json2csv转换数据
    try {
      const parser = new Parser({ fields });
      // 添加UTF-8 BOM标记确保Excel正确识别中文
      return "\uFEFF" + parser.parse(exportData);
    } catch (err) {
      throw new BadRequestException(`导出CSV失败: ${err.message}`);
    }
  }
} 