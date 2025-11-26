import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  Between,
  FindOptionsWhere,
  Not,
  IsNull,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
  Raw,
} from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ExpensePermissionService } from './services/expense-permission.service';
import { Parser } from 'json2csv';
import { ExportExpenseDto } from './dto/export-expense.dto';
import { Customer } from '../customer/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CancelAuditDto } from './dto/cancel-audit.dto';
import { ViewReceiptDto } from './dto/view-receipt.dto';
import { Department } from '../department/entities/department.entity';
import { DataSource } from 'typeorm';
import { BusinessOption } from '../business-options/entities/business-option.entity';


@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly expensePermissionService: ExpensePermissionService,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(BusinessOption)
    private readonly businessOptionRepository: Repository<BusinessOption>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 处理业务查询筛选逻辑
   * @param businessInquiries 业务查询值数组
   * @returns 返回查询条件数组和参数对象
   */
  private async buildBusinessInquiryConditions(
    businessInquiries: string[],
  ): Promise<{ conditions: string[]; params: Record<string, any> }> {
    // 定义费用类型映射表（字段非空且非0筛选）
    const feeTypeMapping = {
      '代理费': 'agencyFee',
      '记账软件费': 'accountingSoftwareFee',
      '开票软件费': 'invoiceSoftwareFee',
      '地址费': 'addressFee',
      '社保代理费': 'socialInsuranceAgencyFee',
      '公积金代理费': 'housingFundAgencyFee',
      '统计局报表费': 'statisticalReportFee',
      '客户资料整理费': 'customerDataOrganizationFee',
      '办照费用': 'licenseFee',
      '牌子费': 'brandFee',
      '备案章费用': 'recordSealFee',
      '一般刻章费用': 'generalSealFee',
    };

    // category 字段到 sys_expense 表字段的映射
    const categoryFieldMapping = {
      'change_business': 'changeBusiness',
      'administrative_license': 'administrativeLicense',
      'other_business_outsourcing': 'otherBusinessOutsourcing',
      'other_business_basic': 'otherBusiness',
      'other_business_special': 'otherBusinessSpecial',
    };

    const allConditions: string[] = [];
    const allParams: Record<string, any> = {};
    let paramIndex = 0;

    // 遍历每个业务查询值，构建对应的查询条件
    for (const searchValue of businessInquiries) {
      if (searchValue && searchValue.trim() !== '') {
        const trimmedValue = searchValue.trim();

        // 1. 先检查是否为费用类型
        if (feeTypeMapping[trimmedValue]) {
          const fieldName = feeTypeMapping[trimmedValue];
          allConditions.push(
            `(expense.${fieldName} IS NOT NULL AND expense.${fieldName} != 0)`
          );
          console.log(`业务查询 - 费用类型: ${trimmedValue} -> ${fieldName}`);
        } else {
          // 2. 不在费用类型中，查询 business_options 表
          const businessOption = await this.businessOptionRepository.findOne({
            where: { optionValue: trimmedValue },
          });

          if (businessOption) {
            // 获取 category 字段对应的映射字段
            const expenseField = categoryFieldMapping[businessOption.category];
            
            if (expenseField) {
              const paramKey = `businessValue${paramIndex}`;
              allConditions.push(
                `JSON_CONTAINS(expense.${expenseField}, JSON_QUOTE(:${paramKey}))`
              );
              allParams[paramKey] = trimmedValue;
              paramIndex++;
              
              console.log(
                `业务查询 - 动态查询: ${trimmedValue} -> category: ${businessOption.category} -> field: ${expenseField}`
              );
            } else {
              console.warn(
                `业务查询 - 未找到category映射: ${businessOption.category}`
              );
            }
          } else {
            console.warn(`业务查询 - 未找到业务选项: ${trimmedValue}`);
          }
        }
      }
    }

    return { conditions: allConditions, params: allParams };
  }

  async create(createExpenseDto: CreateExpenseDto, username: string) {
    // 添加调试信息
    console.log(
      '收到的relatedContract数据:',
      JSON.stringify(createExpenseDto.relatedContract),
    );

    // 检查客户表中是否已存在该客户
    let customerExists = false;
    let customerInfo = null;
    let createdCustomer = null;

    if (
      createExpenseDto.companyName ||
      createExpenseDto.unifiedSocialCreditCode
    ) {
      // 构建查询条件
      const whereCondition = [];
      const queryParams = [];

      if (createExpenseDto.companyName) {
        whereCondition.push('companyName = ?');
        queryParams.push(createExpenseDto.companyName);
      }

      if (createExpenseDto.unifiedSocialCreditCode) {
        whereCondition.push('unifiedSocialCreditCode = ?');
        queryParams.push(createExpenseDto.unifiedSocialCreditCode);
      }

      // 使用原生SQL查询客户表
      const queryResult = await this.customerRepository.query(
        `SELECT * FROM sys_customer WHERE ${whereCondition.join(' OR ')}`,
        queryParams,
      );

      if (queryResult && queryResult.length > 0) {
        customerInfo = queryResult[0];
        customerExists = true;
      }

      // 如果客户不存在，则创建客户
      if (!customerExists) {
        try {
          // 查询用户信息
          const user = await this.userRepository.findOne({
            where: { username },
            relations: ['department'],
          });

          if (!user) {
            console.error(`找不到用户: ${username}`);
          } else {
            // 创建客户信息
            const createCustomerDto = {
              companyName: createExpenseDto.companyName,
              unifiedSocialCreditCode: createExpenseDto.unifiedSocialCreditCode,
              enterpriseType: createExpenseDto.companyType,
              location: createExpenseDto.companyLocation,
              submitter: username,
            };

            // 创建客户实体
            const customer = this.customerRepository.create(createCustomerDto);

            // 保存客户信息
            createdCustomer = await this.customerRepository.save(customer);
            console.log(`成功创建客户: ${createdCustomer.companyName}`);
          }
        } catch (error) {
          console.error('创建客户失败:', error);
          // 创建客户失败不影响费用记录的创建
        }
      } else {
        console.log(`客户已存在: ${customerInfo.companyName}`);
      }
    }

    // 确保relatedContract是正确的格式
    if (createExpenseDto.relatedContract) {
      // 确保数据是数组格式
      if (!Array.isArray(createExpenseDto.relatedContract)) {
        console.error('relatedContract不是数组格式');
        createExpenseDto.relatedContract = [];
      } else {
        // 确保每个元素都是正确的对象格式
        createExpenseDto.relatedContract = createExpenseDto.relatedContract
          .map((item) => {
            if (typeof item === 'object' && item !== null) {
              return {
                id: item.id,
                contractNumber: item.contractNumber,
              };
            } else {
              console.error('无效的relatedContract项:', item);
              return null;
            }
          })
          .filter((item) => item !== null);
      }
      console.log(
        '处理后的relatedContract数据:',
        JSON.stringify(createExpenseDto.relatedContract),
      );
    }

    // 自动填充开始日期字段
    let hasQueryIdentifier = false;

    // 首先尝试使用统一社会信用代码查询
    if (createExpenseDto.unifiedSocialCreditCode) {
      console.log(
        `根据统一社会信用代码 ${createExpenseDto.unifiedSocialCreditCode} 查询最新已审核费用记录`,
      );
      hasQueryIdentifier = true;
      await this.autoFillStartDates(
        createExpenseDto,
        'unifiedSocialCreditCode',
        createExpenseDto.unifiedSocialCreditCode,
      );
    }
    // 如果统一社会信用代码为空但公司名称不为空，则使用公司名称查询
    else if (createExpenseDto.companyName) {
      console.log(
        `根据企业名称 ${createExpenseDto.companyName} 查询最新已审核费用记录`,
      );
      hasQueryIdentifier = true;
      await this.autoFillStartDates(
        createExpenseDto,
        'companyName',
        createExpenseDto.companyName,
      );
    }

    if (!hasQueryIdentifier) {
      console.log(
        '未提供有效的查询标识符（统一社会信用代码或企业名称），跳过自动填充',
      );
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      // 删除自动设置 salesperson 的代码
    });

    // 如果有收费日期，则生成收据编号
    if (expense.chargeDate) {
      try {
        expense.receiptNo = await this.generateReceiptNo(expense.chargeDate);
      } catch (error) {
        console.error('生成收据编号出错:', error);
      }
    }

    // 保存费用记录
    const savedExpense = await this.expenseRepository.save(expense);

    // 添加调试信息
    console.log(
      '保存后的relatedContract数据:',
      JSON.stringify(savedExpense.relatedContract),
    );

    // 准备客户信息消息
    let customerMessage = '';

    if (createdCustomer) {
      customerMessage = `已自动创建客户: ${createdCustomer.companyName}`;
    } else if (customerExists && customerInfo) {
      customerMessage = `客户已存在: ${customerInfo.companyName}`;
    }

    // 这个字段将被transform.interceptor读取并添加到顶层message中
    const result = {
      ...savedExpense,
      __customerMessage: customerMessage, // 这个字段会在controller层被处理
    };

    return result;
  }

  // 辅助方法：根据查询条件自动填充开始日期字段
  private async autoFillStartDates(
    createExpenseDto: CreateExpenseDto,
    fieldName: string,
    fieldValue: string,
  ): Promise<void> {
    try {
      // 首先查询一次，确认是否有相关的已审核记录
      const checkQuery = `SELECT COUNT(*) as count FROM sys_expense WHERE ${fieldName} = ? AND status = 1`;
      const checkResult = await this.expenseRepository.query(checkQuery, [
        fieldValue,
      ]);

      if (checkResult[0].count > 0) {
        console.log(
          `找到 ${checkResult[0].count} 条现有已审核费用记录，开始查询各结束日期最大值`,
        );

        // 直接使用SQL查询每个字段的最大值，只查询已审核记录
        const maxDatesQuery = `
          SELECT 
            MAX(agencyEndDate) as maxAgencyEndDate,
            MAX(accountingSoftwareEndDate) as maxAccountingSoftwareEndDate,
            MAX(invoiceSoftwareEndDate) as maxInvoiceSoftwareEndDate,
            MAX(socialInsuranceEndDate) as maxSocialInsuranceEndDate,
            MAX(housingFundEndDate) as maxHousingFundEndDate,
            MAX(statisticalEndDate) as maxStatisticalEndDate,
            MAX(addressEndDate) as maxAddressEndDate,
            MAX(onlineBankingCustodyEndDate) as maxOnlineBankingCustodyEndDate
          FROM sys_expense 
          WHERE ${fieldName} = ? AND status = 1`;

        const maxDatesResult = await this.expenseRepository.query(
          maxDatesQuery,
          [fieldValue],
        );
        console.log(`SQL查询结果:`, JSON.stringify(maxDatesResult[0], null, 2));

        // 处理每个日期字段
        const dateFields = {
          maxAgencyEndDate: 'agencyStartDate',
          maxAccountingSoftwareEndDate: 'accountingSoftwareStartDate',
          maxInvoiceSoftwareEndDate: 'invoiceSoftwareStartDate',
          maxSocialInsuranceEndDate: 'socialInsuranceStartDate',
          maxHousingFundEndDate: 'housingFundStartDate',
          maxStatisticalEndDate: 'statisticalStartDate',
          maxAddressEndDate: 'addressStartDate',
          maxOnlineBankingCustodyEndDate: 'onlineBankingCustodyStartDate',
        };

        for (const [dbField, dtoField] of Object.entries(dateFields)) {
          const dateValue = maxDatesResult[0][dbField];
          if (dateValue) {
            // 先使用旧的方法计算下一天的日期（获取完整日期）
            const calculatedDate = this.getNextDay(dateValue);

            // 检查用户是否传入了该字段的日期
            const hasUserInput =
              createExpenseDto[dtoField] !== undefined &&
              createExpenseDto[dtoField] !== null &&
              createExpenseDto[dtoField] !== '';

            if (hasUserInput) {
              // 用户传入了日期，从计算日期中提取年月，从用户日期中提取日
              const [calculatedYear, calculatedMonth] =
                calculatedDate.split('-');
              try {
                const userDate = new Date(createExpenseDto[dtoField]);
                if (!isNaN(userDate.getTime())) {
                  // 提取用户传入日期的日部分
                  const userSelectedDay = String(userDate.getDate()).padStart(
                    2,
                    '0',
                  );
                  console.log(
                    `从用户输入中提取到日期: ${dtoField} = ${userSelectedDay}日`,
                  );

                  // 组合年月和用户选择的日
                  const combinedDate = `${calculatedYear}-${calculatedMonth}-${userSelectedDay}`;

                  // 验证组合后的日期是否有效
                  const testDate = new Date(combinedDate);
                  if (isNaN(testDate.getTime())) {
                    // 如果无效（比如2月30日），则使用计算的日期
                    console.warn(
                      `组合后的日期 ${combinedDate} 无效，使用计算的日期 ${calculatedDate}`,
                    );
                    createExpenseDto[dtoField] = calculatedDate;
                  } else {
                    createExpenseDto[dtoField] = combinedDate;
                  }

                  console.log(
                    `设置${dtoField}: ${createExpenseDto[dtoField]} (年月从${dbField}计算，日从用户输入获取)`,
                  );
                } else {
                  // 用户传入的日期无效，使用计算的日期
                  console.warn(
                    `无法解析用户输入的日期 ${createExpenseDto[dtoField]}，使用计算的日期 ${calculatedDate}`,
                  );
                  createExpenseDto[dtoField] = calculatedDate;
                }
              } catch (error) {
                // 解析出错，使用计算的日期
                console.error(
                  `解析用户输入的日期失败，使用计算的日期: ${calculatedDate}`,
                  error,
                );
                createExpenseDto[dtoField] = calculatedDate;
              }
            } else {
              // 用户没有传入日期，直接使用计算的完整日期
              createExpenseDto[dtoField] = calculatedDate;
              console.log(
                `用户未传入${dtoField}，使用计算的完整日期: ${calculatedDate}`,
              );
            }
          } else {
            console.log(
              `${dbField}为空，保留原始值: ${createExpenseDto[dtoField]}`,
            );
          }
        }
      } else {
        console.log(`未找到${fieldName}为 ${fieldValue} 的现有记录`);
      }
    } catch (error) {
      console.error('查询现有费用记录失败:', error);
    }
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

    console.log(`费用查询 - 用户ID: ${userId}, 查询参数:`, query);
    console.log(`费用查询 - 分页参数: page=${page}, pageSize=${pageSize}`);

    // 获取权限过滤条件
    const permissionFilter =
      await this.expensePermissionService.buildExpenseQueryFilter(userId);

    console.log(`费用查询 - 权限过滤条件:`, permissionFilter);

    // 记录原始权限过滤条件，稍后用于构建复合查询
    const originalPermissionFilter = permissionFilter;

    // 创建查询构建器
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    // 首先应用权限过滤条件
    if (Array.isArray(permissionFilter)) {
      if (permissionFilter.length === 0) {
        // 如果没有任何权限，返回空结果
        return {
          list: [],
          total: 0,
          currentPage: page,
          pageSize,
        };
      }

      // 检查是否包含查看所有权限的空对象
      const hasViewAllPermission = permissionFilter.some(filter => 
        Object.keys(filter).length === 0
      );

      if (!hasViewAllPermission) {
        // 处理多个OR条件的权限过滤
        const permissionConditions = [];
        const permissionParams = {};

        permissionFilter.forEach((filter, index) => {
          const conditions = [];
          Object.entries(filter).forEach(([key, value]) => {
            const paramKey = `permission_${key}_${index}`;
            conditions.push(`expense.${key} = :${paramKey}`);
            permissionParams[paramKey] = value;
          });
          
          if (conditions.length > 0) {
            permissionConditions.push(`(${conditions.join(' AND ')})`);
          }
        });

        if (permissionConditions.length > 0) {
          queryBuilder.where(`(${permissionConditions.join(' OR ')})`, permissionParams);
        }
      }
      // 如果有查看所有权限，不添加任何权限过滤条件
    } else {
      // 处理单一权限过滤条件
      // 检查是否为查看所有权限的空对象
      if (Object.keys(permissionFilter).length > 0) {
        const params = {};
        let whereClause = '';

        Object.entries(permissionFilter).forEach(([key, value]) => {
          if (whereClause) whereClause += ' AND ';
          const paramKey = `permission_${key}`;
          whereClause += `expense.${key} = :${paramKey}`;
          params[paramKey] = value;
        });

        if (whereClause) {
          queryBuilder.where(whereClause, params);
        }
      }
      // 如果是空对象，表示有查看所有权限，不添加任何权限过滤条件
    }

    // 然后在权限过滤的基础上应用查询参数
    if (query.companyName !== undefined) {
      if (query.companyName === '') {
        queryBuilder.andWhere(
          "(expense.companyName IS NULL OR expense.companyName = '')",
        );
      } else {
        queryBuilder.andWhere('expense.companyName LIKE :companyName', {
          companyName: `%${query.companyName}%`,
        });
      }
    }

    if (query.unifiedSocialCreditCode !== undefined) {
      if (query.unifiedSocialCreditCode === '') {
        queryBuilder.andWhere(
          "(expense.unifiedSocialCreditCode IS NULL OR expense.unifiedSocialCreditCode = '')",
        );
      } else {
        queryBuilder.andWhere(
          'expense.unifiedSocialCreditCode LIKE :unifiedSocialCreditCode',
          { unifiedSocialCreditCode: `%${query.unifiedSocialCreditCode}%` },
        );
      }
    }

    if (query.companyType !== undefined) {
      if (query.companyType === '') {
        queryBuilder.andWhere(
          "(expense.companyType IS NULL OR expense.companyType = '')",
        );
      } else {
        queryBuilder.andWhere('expense.companyType LIKE :companyType', {
          companyType: `%${query.companyType}%`,
        });
      }
    }

    if (query.companyLocation !== undefined) {
      if (query.companyLocation === '') {
        queryBuilder.andWhere(
          "(expense.companyLocation IS NULL OR expense.companyLocation = '')",
        );
      } else {
        queryBuilder.andWhere('expense.companyLocation LIKE :companyLocation', {
          companyLocation: `%${query.companyLocation}%`,
        });
      }
    }

    if (query.businessType !== undefined) {
      if (query.businessType === '') {
        queryBuilder.andWhere(
          "(expense.businessType IS NULL OR expense.businessType = '')",
        );
      } else {
        // 处理多选业务类型筛选
        const businessTypes = Array.isArray(query.businessType) 
          ? query.businessType 
          : [query.businessType];
        
        if (businessTypes.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = businessTypes.some(type => 
            type === '' || type === null || type === undefined || type === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(expense.businessType IS NULL OR expense.businessType = '')");
          }
          
          // 处理非空值
          businessTypes.forEach((type) => {
            if (type !== '' && type !== null && type !== undefined && type !== 'null') {
              conditions.push(`expense.businessType LIKE :businessType${paramIndex}`);
              params[`businessType${paramIndex}`] = `%${type}%`;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (query.socialInsuranceBusinessType !== undefined) {
      if (query.socialInsuranceBusinessType === '') {
        queryBuilder.andWhere(
          "(expense.socialInsuranceBusinessType IS NULL OR expense.socialInsuranceBusinessType = '')",
        );
      } else {
        // 处理多选社保代理业务类型筛选
        const socialInsuranceBusinessTypes = Array.isArray(query.socialInsuranceBusinessType) 
          ? query.socialInsuranceBusinessType 
          : [query.socialInsuranceBusinessType];
        
        if (socialInsuranceBusinessTypes.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = socialInsuranceBusinessTypes.some(type => 
            type === '' || type === null || type === undefined || type === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(expense.socialInsuranceBusinessType IS NULL OR expense.socialInsuranceBusinessType = '')");
          }
          
          // 处理非空值
          socialInsuranceBusinessTypes.forEach((type) => {
            if (type !== '' && type !== null && type !== undefined && type !== 'null') {
              conditions.push(`expense.socialInsuranceBusinessType LIKE :socialInsuranceBusinessType${paramIndex}`);
              params[`socialInsuranceBusinessType${paramIndex}`] = `%${type}%`;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (query.status !== undefined) {
      queryBuilder.andWhere('expense.status = :status', {
        status: query.status,
      });
    }

    if (query.salesperson !== undefined) {
      if (query.salesperson === '') {
        queryBuilder.andWhere(
          "(expense.salesperson IS NULL OR expense.salesperson = '')",
        );
      } else {
        queryBuilder.andWhere('expense.salesperson LIKE :salesperson', {
          salesperson: `%${query.salesperson}%`,
        });
      }
    }

    if (query.chargeMethod !== undefined) {
      if (query.chargeMethod === '') {
        queryBuilder.andWhere(
          "(expense.chargeMethod IS NULL OR expense.chargeMethod = '')",
        );
      } else {
        queryBuilder.andWhere('expense.chargeMethod LIKE :chargeMethod', {
          chargeMethod: `%${query.chargeMethod}%`,
        });
      }
    }

    if (query.receiptNo !== undefined) {
      if (query.receiptNo === '') {
        queryBuilder.andWhere(
          "(expense.receiptNo IS NULL OR expense.receiptNo = '')",
        );
      } else {
        queryBuilder.andWhere('expense.receiptNo LIKE :receiptNo', {
          receiptNo: `%${query.receiptNo}%`,
        });
      }
    }

    if (query.auditor !== undefined) {
      if (query.auditor === '') {
        queryBuilder.andWhere(
          "(expense.auditor IS NULL OR expense.auditor = '')",
        );
      } else {
        queryBuilder.andWhere('expense.auditor LIKE :auditor', {
          auditor: `%${query.auditor}%`,
        });
      }
    }

    if (query.chargeDateStart && query.chargeDateEnd) {
      queryBuilder.andWhere(
        'expense.chargeDate BETWEEN :startDate AND :endDate',
        { startDate: query.chargeDateStart, endDate: query.chargeDateEnd },
      );
    } else if (query.chargeDateStart) {
      queryBuilder.andWhere('expense.chargeDate >= :startDate', {
        startDate: query.chargeDateStart,
      });
    } else if (query.chargeDateEnd) {
      queryBuilder.andWhere('expense.chargeDate <= :endDate', {
        endDate: query.chargeDateEnd,
      });
    }

    if (query.startDate && query.endDate) {
      // 创建日期对象
      const startDate = new Date(query.startDate);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'expense.createdAt BETWEEN :createdStartDate AND :createdEndDate',
        {
          createdStartDate: startDate,
          createdEndDate: endDate,
        },
      );

      console.log(
        `创建日期查询范围: ${startDate.toISOString()} - ${endDate.toISOString()}`,
      );
    }

    if (query.auditDateStart && query.auditDateEnd) {
      // 创建审核日期对象
      const auditStartDate = new Date(query.auditDateStart);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const auditEndDate = new Date(query.auditDateEnd);
      auditEndDate.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'expense.auditDate BETWEEN :auditStartDate AND :auditEndDate',
        {
          auditStartDate: auditStartDate,
          auditEndDate: auditEndDate,
        },
      );

      console.log(
        `审核日期查询范围: ${auditStartDate.toISOString()} - ${auditEndDate.toISOString()}`,
      );
    } else if (query.auditDateStart) {
      queryBuilder.andWhere('expense.auditDate >= :auditStartDate', {
        auditStartDate: new Date(query.auditDateStart),
      });
    } else if (query.auditDateEnd) {
      const auditEndDate = new Date(query.auditDateEnd);
      auditEndDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('expense.auditDate <= :auditEndDate', {
        auditEndDate: auditEndDate,
      });
    }

    // 业务查询筛选逻辑（支持多选）
    if (query.businessInquiry !== undefined && query.businessInquiry !== '') {
      // 处理多选业务查询筛选
      const businessInquiries = Array.isArray(query.businessInquiry) 
        ? query.businessInquiry 
        : [query.businessInquiry];
      
      if (businessInquiries.length > 0) {
        // 使用统一的方法构建查询条件
        const { conditions, params } = await this.buildBusinessInquiryConditions(businessInquiries);
        
        // 如果有条件，使用OR连接所有条件（多选是或的关系）
        if (conditions.length > 0) {
          queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
        }
        
        console.log(`业务查询 - 搜索值: ${businessInquiries.join(', ')}`);
      }
    }

    // 修改排序逻辑：首先按照创建时间降序排序
    queryBuilder.orderBy('expense.createdAt', 'DESC');

    // 如果需要其他排序条件，可以作为次要排序
    // queryBuilder.addOrderBy('expense.id', 'DESC');

    // 应用分页
    queryBuilder.skip(skip).take(pageSize);

    // 打印最终的SQL查询和参数
    console.log(`费用查询 - 最终SQL:`, queryBuilder.getQuery());
    console.log(`费用查询 - 查询参数:`, queryBuilder.getParameters());

    // 执行查询
    const [expenses, total] = await queryBuilder.getManyAndCount();

    console.log(`费用查询 - 返回结果数量: ${expenses.length}, 总数: ${total}`);

    // 返回结果
    return {
      list: expenses,
      total,
      currentPage: page,
      pageSize,
    };
  }

  async findOne(id: number, userId: number) {
    console.log(
      `findOne方法被调用 - ID: ${id}, 类型: ${typeof id}, userId: ${userId}`,
    );

    // 确保ID是有效数字
    if (id === undefined || id === null || isNaN(id)) {
      console.error(`无效的ID参数: ${id}`);
      throw new BadRequestException(`无效的费用ID: ${id}`);
    }

    try {
      console.log(`执行查询 - SELECT * FROM sys_expense WHERE id = ${id}`);

      // 使用原始SQL查询避免TypeORM的潜在问题
      const result = await this.expenseRepository.query(
        'SELECT * FROM sys_expense WHERE id = ? LIMIT 1',
        [id],
      );

      console.log(`SQL查询结果: ${result ? '找到记录' : '未找到记录'}`);

      if (!result || result.length === 0) {
        console.error(`未找到费用记录 #${id}`);
        throw new NotFoundException(`费用记录 #${id} 不存在`);
      }

      const expense = result[0];
      console.log(
        `找到费用记录 - ID: ${expense.id}, 公司: ${expense.companyName}`,
      );

      // 检查用户是否有权限查看该记录
      console.log(`获取用户 ${userId} 的权限过滤条件`);
      const permissionFilter =
        await this.expensePermissionService.buildExpenseQueryFilter(userId);
      console.log(`权限过滤条件: ${JSON.stringify(permissionFilter)}`);

      const hasPermission = Array.isArray(permissionFilter)
        ? permissionFilter.some((filter) => this.matchesFilter(expense, filter))
        : this.matchesFilter(expense, permissionFilter);

      console.log(`权限检查结果: ${hasPermission}`);

      if (!hasPermission) {
        throw new BadRequestException('没有权限查看该费用记录');
      }

      return expense;
    } catch (error) {
      console.error(`findOne方法出错: ${error.message}`);

      // 重新抛出适当的异常
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else {
        throw new BadRequestException(`查询费用记录失败: ${error.message}`);
      }
    }
  }

  private matchesFilter(expense: Expense, filter: any): boolean {
    if (!filter || Object.keys(filter).length === 0) {
      return true;
    }
    return Object.entries(filter).every(
      ([key, value]) => expense[key] === value,
    );
  }

  async update(
    id: number,
    updateExpenseDto: UpdateExpenseDto,
    userId: number,
    username: string,
  ) {
    const expense = await this.findOne(id, userId);

    // 检查用户是否有编辑权限
    const hasEditPermission =
      await this.expensePermissionService.hasExpenseEditPermission(userId);

    if (!hasEditPermission) {
      throw new BadRequestException('没有权限编辑费用记录');
    }

    // 非管理员只能编辑自己创建且未审核或被退回的费用记录
    if (
      !(await this.expensePermissionService.hasExpenseAuditPermission(userId))
    ) {
      if (
        expense.salesperson !== username ||
        (expense.status !== 0 && expense.status !== 2)
      ) {
        throw new BadRequestException(
          '只能编辑自己创建且未审核或被退回的费用记录',
        );
      }
    }

    // 获取用户信息和角色
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('无法获取用户信息');
    }

    // 检查用户是否有特定角色（费用审核员、管理员或超级管理员）
    const hasSpecialRole =
      user.roles &&
      (user.roles.includes('expense_auditor') || // 费用审核员
        user.roles.includes('admin') || // 管理员
        user.roles.includes('super_admin')); // 超级管理员

    console.log(
      `用户 ${user.username} 的角色: ${user.roles ? user.roles.join(', ') : '无角色'}, 特殊角色检查结果: ${hasSpecialRole}`,
    );

    // 定义需要特殊处理的日期字段列表
    const protectedDateFields = [
      'agencyStartDate',
      'accountingSoftwareStartDate',
      'invoiceSoftwareStartDate',
      'socialInsuranceStartDate',
      'housingFundStartDate',
      'statisticalStartDate',
      'addressStartDate',
    ];

    // 如果不是特定角色，则对日期字段进行特殊处理
    if (!hasSpecialRole) {
      console.log('用户不是特定角色，处理日期字段');

      // 遍历受保护的日期字段
      for (const field of protectedDateFields) {
        // 检查更新DTO中是否包含此字段
        if (field in updateExpenseDto && updateExpenseDto[field]) {
          console.log(`处理日期字段 ${field}`);

          // 确保原始记录中有该日期字段
          if (expense[field]) {
            try {
              // 从原始记录中获取年月部分
              const originalDate = new Date(expense[field]);
              const originalYear = originalDate.getFullYear();
              const originalMonth = originalDate.getMonth() + 1; // 月份从0开始，需要+1

              console.log(
                `原始日期 ${field}: ${expense[field]}, 年: ${originalYear}, 月: ${originalMonth}`,
              );

              // 解析用户提供的新日期
              const userDate = new Date(updateExpenseDto[field]);

              // 检查用户日期是否有效
              if (!isNaN(userDate.getTime())) {
                // 提取用户日期中的日部分
                const userDay = userDate.getDate();
                console.log(
                  `用户输入日期: ${updateExpenseDto[field]}, 提取的日: ${userDay}`,
                );

                // 组合原始年月和用户提供的日
                const combinedDate = new Date(
                  originalYear,
                  originalMonth - 1,
                  userDay,
                );

                // 格式化为YYYY-MM-DD
                const year = combinedDate.getFullYear();
                const month = String(combinedDate.getMonth() + 1).padStart(
                  2,
                  '0',
                );
                const day = String(combinedDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                // 验证组合后的日期是否有效
                const testDate = new Date(formattedDate);
                if (!isNaN(testDate.getTime())) {
                  // 如果有效，替换为组合后的日期
                  console.log(
                    `保留年月，仅修改日: ${field} = ${formattedDate}`,
                  );
                  updateExpenseDto[field] = formattedDate;
                } else {
                  // 如果无效，保留原始日期
                  console.warn(
                    `组合后的日期 ${formattedDate} 无效，保留原始日期 ${expense[field]}`,
                  );
                  updateExpenseDto[field] = expense[field];
                }
              } else {
                // 如果用户提供的日期无效，保留原始日期
                console.warn(
                  `用户提供的日期 ${updateExpenseDto[field]} 无效，保留原始日期`,
                );
                updateExpenseDto[field] = expense[field];
              }
            } catch (error) {
              // 处理错误，保留原始日期
              console.error(`处理日期字段 ${field} 失败:`, error);
              updateExpenseDto[field] = expense[field];
            }
          } else {
            // 如果原始记录没有该字段，则允许用户设置（可能是首次设置）
            console.log(`原始记录没有日期字段 ${field}，允许设置`);
          }
        }
      }
    } else {
      console.log('用户具有特殊角色，可以完全修改日期字段');
    }

    console.log(
      '更新请求中的relatedContract数据:',
      JSON.stringify(updateExpenseDto.relatedContract),
    );

    // 确保relatedContract是正确的格式
    if (updateExpenseDto.relatedContract) {
      // 确保数据是数组格式
      if (!Array.isArray(updateExpenseDto.relatedContract)) {
        console.error('relatedContract不是数组格式');
        updateExpenseDto.relatedContract = [];
      } else {
        // 确保每个元素都是正确的对象格式
        updateExpenseDto.relatedContract = updateExpenseDto.relatedContract
          .map((item) => {
            if (typeof item === 'object' && item !== null) {
              return {
                id: item.id,
                contractNumber: item.contractNumber,
              };
            } else {
              console.error('无效的relatedContract项:', item);
              return null;
            }
          })
          .filter((item) => item !== null);
      }
      console.log(
        '处理后的relatedContract数据:',
        JSON.stringify(updateExpenseDto.relatedContract),
      );
    }

    // 检查收费日期是否有变更
    let needUpdateReceiptNo = false;

    if (updateExpenseDto.chargeDate !== undefined) {
      // 确保两个日期的格式一致后再比较
      const oldDateStr = expense.chargeDate
        ? expense.chargeDate.toString().split('T')[0]
        : '';
      const newDateStr = updateExpenseDto.chargeDate
        ? updateExpenseDto.chargeDate.toString().split('T')[0]
        : '';

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

    // 保存更新后的记录
    const savedExpense = await this.expenseRepository.save(updated);

    // 添加调试信息
    console.log(
      '更新后的relatedContract数据:',
      JSON.stringify(savedExpense.relatedContract),
    );

    // 使用原始SQL查询获取最新数据（保持日期格式原样）
    const rawResult = await this.expenseRepository.query(
      'SELECT * FROM sys_expense WHERE id = ?',
      [id],
    );

    // 获取结果并格式化日期字段
    const result = rawResult[0];

    if (result) {
      // 需要格式化的日期字段列表
      const dateFields = [
        'accountingSoftwareStartDate',
        'accountingSoftwareEndDate',
        'addressStartDate',
        'addressEndDate',
        'agencyStartDate',
        'agencyEndDate',
        'invoiceSoftwareStartDate',
        'invoiceSoftwareEndDate',
        'socialInsuranceStartDate',
        'socialInsuranceEndDate',
        'housingFundStartDate',
        'housingFundEndDate',
        'statisticalStartDate',
        'statisticalEndDate',
        'chargeDate',
        'auditDate',
      ];

      // 处理每个日期字段
      dateFields.forEach((field) => {
        if (result[field] && result[field] instanceof Date) {
          // 将日期转换为YYYY-MM-DD格式
          const date = new Date(result[field]);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          result[field] = `${year}-${month}-${day}`;
        }
      });
    }

    // 返回格式化后的结果
    return result;
  }

  async remove(id: number, userId: number) {
    const expense = await this.findOne(id, userId);

    // 检查用户是否有编辑权限
    const hasEditPermission =
      await this.expensePermissionService.hasExpenseDeletePermission(userId);
    if (!hasEditPermission) {
      throw new BadRequestException('没有权限删除费用记录');
    }

    // 后端保护：检查费用记录状态，已审核通过的记录不能直接删除
    if (expense.status === 1) {
      throw new BadRequestException(
        '已审核通过的费用记录不能直接删除，请先取消审核',
      );
    }

    return await this.expenseRepository.remove(expense);
  }

  async audit(
    id: number,
    userId: number,
    auditor: string,
    status: number,
    reason?: string,
  ) {
    console.log(`----- 审核方法开始 -----`);
    console.log(
      `参数 - ID: ${id}, 用户ID: ${userId}, 审核员: ${auditor}, 状态: ${status}, 原因: ${reason || '无'}`,
    );

    const expense = await this.findOne(id, userId);
    console.log(
      `找到费用记录 - 公司: ${expense.companyName}, 状态: ${expense.status}, 社会信用代码: ${expense.unifiedSocialCreditCode}, 总费用: ${expense.totalFee}`,
    );

    // 检查用户是否有审核权限
    const hasAuditPermission =
      await this.expensePermissionService.hasExpenseAuditPermission(userId);
    console.log(`审核权限检查结果: ${hasAuditPermission}`);

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

    console.log(
      `保存费用记录前 - 状态: ${expense.status}, 审核员: ${expense.auditor}`,
    );
    const updatedExpense = await this.expenseRepository.save(expense);
    console.log(
      `保存费用记录后 - 状态: ${updatedExpense.status}, 审核员: ${updatedExpense.auditor}`,
    );

    // 如果审核通过，更新客户的费用贡献金额
    if (status === 1 && expense.unifiedSocialCreditCode && expense.totalFee) {
      try {
        console.log(
          `准备更新客户费用贡献金额, 统一社会信用代码: ${expense.unifiedSocialCreditCode}, 费用金额: ${expense.totalFee}`,
        );

        // 直接查询数据库，获取客户当前数据
        const customerCheckQuery = `SELECT id, companyName, contributionAmount FROM sys_customer WHERE unifiedSocialCreditCode = ? LIMIT 1`;
        const customerBeforeUpdate = await this.customerRepository.query(
          customerCheckQuery,
          [expense.unifiedSocialCreditCode],
        );
        console.log(
          '直接SQL查询的客户数据:',
          JSON.stringify(customerBeforeUpdate),
        );

        if (customerBeforeUpdate && customerBeforeUpdate.length > 0) {
          const customer = customerBeforeUpdate[0];
          console.log(
            `找到客户: ${customer.companyName}, ID: ${customer.id}, 当前费用贡献金额: ${customer.contributionAmount || 0}`,
          );

          // 处理可能的空值和类型转换
          let currentAmount = 0;
          if (
            customer.contributionAmount !== null &&
            customer.contributionAmount !== undefined
          ) {
            currentAmount =
              typeof customer.contributionAmount === 'string'
                ? parseFloat(customer.contributionAmount)
                : customer.contributionAmount;
          }

          const feeAmount =
            typeof expense.totalFee === 'string'
              ? parseFloat(expense.totalFee)
              : expense.totalFee;

          console.log(
            `计算 - 当前金额(${typeof currentAmount}): ${currentAmount}, 费用金额(${typeof feeAmount}): ${feeAmount}`,
          );

          // 计算新金额
          const newAmount = currentAmount + feeAmount;
          console.log(`计算后的新金额(${typeof newAmount}): ${newAmount}`);

          // 直接使用SQL更新
          const updateQuery = `UPDATE sys_customer SET contributionAmount = ? WHERE id = ?`;
          await this.customerRepository.query(updateQuery, [
            newAmount,
            customer.id,
          ]);
          console.log(`SQL更新执行完成`);

          // 再次查询验证更新结果
          const verifyQuery = `SELECT id, companyName, contributionAmount FROM sys_customer WHERE id = ? LIMIT 1`;
          const verifyResult = await this.customerRepository.query(
            verifyQuery,
            [customer.id],
          );
          console.log('更新后验证的客户数据:', JSON.stringify(verifyResult));

          if (verifyResult && verifyResult.length > 0) {
            console.log(
              `客户 ${verifyResult[0].companyName} 的费用贡献金额更新成功, 更新后值: ${verifyResult[0].contributionAmount}`,
            );
          }
        } else {
          console.error(
            `未找到匹配的客户，统一社会信用代码: ${expense.unifiedSocialCreditCode}`,
          );
        }
      } catch (error) {
        console.error('更新客户费用贡献金额失败:', error);
        // 这里不抛出异常，避免影响审核流程
      }
    }

    console.log(`----- 审核方法结束 -----`);
    return updatedExpense;
  }

  async cancelAudit(
    id: number,
    userId: number,
    username: string,
    cancelReason: string,
  ) {
    const expense = await this.findOne(id, userId);

    // 检查用户是否有审核权限
    const hasAuditPermission =
      await this.expensePermissionService.hasExpenseAuditPermission(userId);
    if (!hasAuditPermission) {
      throw new BadRequestException('没有权限取消审核费用记录');
    }

    if (expense.status === 0) {
      throw new BadRequestException('该费用记录未审核，不能取消审核');
    }

    // 如果是已审核状态，则先扣减客户的费用贡献金额
    if (
      expense.status === 1 &&
      expense.unifiedSocialCreditCode &&
      expense.totalFee
    ) {
      try {
        console.log(
          `准备减少客户费用贡献金额, 统一社会信用代码: ${expense.unifiedSocialCreditCode}, 费用金额: ${expense.totalFee}`,
        );

        // 直接查询数据库，获取客户当前数据
        const customerCheckQuery = `SELECT id, companyName, contributionAmount FROM sys_customer WHERE unifiedSocialCreditCode = ? LIMIT 1`;
        const customerBeforeUpdate = await this.customerRepository.query(
          customerCheckQuery,
          [expense.unifiedSocialCreditCode],
        );
        console.log(
          '直接SQL查询的客户数据:',
          JSON.stringify(customerBeforeUpdate),
        );

        if (customerBeforeUpdate && customerBeforeUpdate.length > 0) {
          const customer = customerBeforeUpdate[0];
          console.log(
            `找到客户: ${customer.companyName}, ID: ${customer.id}, 当前费用贡献金额: ${customer.contributionAmount || 0}`,
          );

          // 处理可能的空值和类型转换
          let currentAmount = 0;
          if (
            customer.contributionAmount !== null &&
            customer.contributionAmount !== undefined
          ) {
            currentAmount =
              typeof customer.contributionAmount === 'string'
                ? parseFloat(customer.contributionAmount)
                : customer.contributionAmount;
          }

          const feeAmount =
            typeof expense.totalFee === 'string'
              ? parseFloat(expense.totalFee)
              : expense.totalFee;

          console.log(
            `计算 - 当前金额(${typeof currentAmount}): ${currentAmount}, 费用金额(${typeof feeAmount}): ${feeAmount}`,
          );

          // 计算新金额，确保不小于0
          const newAmount = Math.max(0, currentAmount - feeAmount);
          console.log(`计算后的新金额(${typeof newAmount}): ${newAmount}`);

          // 直接使用SQL更新
          const updateQuery = `UPDATE sys_customer SET contributionAmount = ? WHERE id = ?`;
          await this.customerRepository.query(updateQuery, [
            newAmount,
            customer.id,
          ]);
          console.log(`SQL更新执行完成`);

          // 再次查询验证更新结果
          const verifyQuery = `SELECT id, companyName, contributionAmount FROM sys_customer WHERE id = ? LIMIT 1`;
          const verifyResult = await this.customerRepository.query(
            verifyQuery,
            [customer.id],
          );
          console.log('更新后验证的客户数据:', JSON.stringify(verifyResult));

          if (verifyResult && verifyResult.length > 0) {
            console.log(
              `客户 ${verifyResult[0].companyName} 的费用贡献金额更新成功, 更新后值: ${verifyResult[0].contributionAmount}`,
            );
          }
        } else {
          console.error(
            `未找到匹配的客户，统一社会信用代码: ${expense.unifiedSocialCreditCode}`,
          );
        }
      } catch (error) {
        console.error('更新客户费用贡献金额失败:', error);
        // 这里不抛出异常，避免影响取消审核流程
      }
    }

    // 更新费用记录状态
    expense.status = 0;
    expense.auditor = null;
    expense.auditDate = null;
    expense.rejectReason = null;

    return await this.expenseRepository.save(expense);
  }

  // 添加新的查看收据方法
  async viewReceipt(
    params: { id?: number; receiptNo?: string },
    userId: number,
  ) {
    console.log(
      `viewReceipt方法被调用 - 参数: ${JSON.stringify(params)}, userId: ${userId}`,
    );

    let expense: Expense;

    // 检查用户是否有查看收据权限
    const hasViewReceiptPermission =
      await this.expensePermissionService.hasExpenseViewReceiptPermission(
        userId,
      );
    console.log(`查看收据权限检查结果: ${hasViewReceiptPermission}`);

    if (!hasViewReceiptPermission) {
      throw new BadRequestException('没有权限查看收据');
    }

    // 参数验证
    if (!params) {
      console.error('没有提供参数');
      throw new BadRequestException('请提供费用ID或收据编号');
    }

    console.log(
      `参数检查 - id: ${params.id} (${typeof params.id}), receiptNo: ${params.receiptNo}`,
    );

    try {
      // 根据参数决定查询方式
      if (params.id !== undefined) {
        // 确保ID是有效的数字
        if (typeof params.id !== 'number' || isNaN(params.id)) {
          console.error(
            `无效的ID参数: ${params.id}, 类型: ${typeof params.id}`,
          );
          throw new BadRequestException(`无效的费用ID: ${params.id}`);
        }

        console.log(`通过ID查询: ${params.id}`);
        expense = await this.findOne(params.id, userId);
      } else if (params.receiptNo) {
        console.log(`通过收据编号查询: ${params.receiptNo}`);
        // 获取权限过滤条件
        const permissionFilter =
          await this.expensePermissionService.buildExpenseQueryFilter(userId);
        console.log(`权限过滤条件: ${JSON.stringify(permissionFilter)}`);

        // 构建查询条件
        let where: any;
        if (Array.isArray(permissionFilter)) {
          // 如果是数组，需要为每个条件添加receiptNo
          where = permissionFilter.map((filter) => ({
            ...filter,
            receiptNo: params.receiptNo,
          }));
        } else {
          // 单个条件对象
          where = {
            ...permissionFilter,
            receiptNo: params.receiptNo,
          };
        }

        console.log(`执行查询 - 条件: ${JSON.stringify(where)}`);
        expense = await this.expenseRepository.findOne({ where });

        if (!expense) {
          console.error(`未找到收据编号为 ${params.receiptNo} 的记录`);
          throw new NotFoundException(
            `未找到收据编号为 ${params.receiptNo} 的记录`,
          );
        }

        console.log(
          `找到费用记录 - ID: ${expense.id}, 公司: ${expense.companyName}, 收据编号: ${expense.receiptNo}`,
        );
      } else {
        console.error('缺少查询参数');
        throw new BadRequestException('请提供有效的费用ID或收据编号');
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
          endDateField: 'agencyEndDate',
        },
        {
          name: '记账软件费',
          amountField: 'accountingSoftwareFee',
          startDateField: 'accountingSoftwareStartDate',
          endDateField: 'accountingSoftwareEndDate',
        },
        {
          name: '地址费',
          amountField: 'addressFee',
          startDateField: 'addressStartDate',
          endDateField: 'addressEndDate',
        },
        {
          name: '网银托管费',
          amountField: 'onlineBankingCustodyFee',
          startDateField: 'onlineBankingCustodyStartDate',
          endDateField: 'onlineBankingCustodyEndDate',
        },
        {
          name: '开票软件费',
          amountField: 'invoiceSoftwareFee',
          startDateField: 'invoiceSoftwareStartDate',
          endDateField: 'invoiceSoftwareEndDate',
        },
        {
          name: '社保代理费',
          amountField: 'socialInsuranceAgencyFee',
          startDateField: 'socialInsuranceStartDate',
          endDateField: 'socialInsuranceEndDate',
          listField: 'insuranceTypes',
        },
        {
          name: '公积金代理费',
          amountField: 'housingFundAgencyFee',
          startDateField: 'housingFundStartDate',
          endDateField: 'housingFundEndDate',
        },
        {
          name: '统计局报表费',
          amountField: 'statisticalReportFee',
          startDateField: 'statisticalStartDate',
          endDateField: 'statisticalEndDate',
        },
        {
          name: '客户资料整理费',
          amountField: 'customerDataOrganizationFee',
          startDateField: 'organizationStartDate',
          endDateField: 'organizationEndDate',
        },
        {
          name: '变更收费',
          amountField: 'changeFee',
          listField: 'changeBusiness',
        },
        {
          name: '行政许可收费',
          amountField: 'administrativeLicenseFee',
          listField: 'administrativeLicense',
        },
        {
          name: '其他业务收费(基础)',
          amountField: 'otherBusinessFee',
          listField: 'otherBusiness',
        },
        {
          name: '其他业务收费',
          amountField: 'otherBusinessOutsourcingFee',
          listField: 'otherBusinessOutsourcing',
        },
        {
          name: '其他业务收费(特殊)',
          amountField: 'otherBusinessSpecialFee',
          listField: 'otherBusinessSpecial',
        },
      ];

      // 遍历费用字段，找出非零的费用(包括负数)
      for (const field of feeFieldsMap) {
        if (expense[field.amountField] && expense[field.amountField] !== 0) {
          let feeName = field.name;

          // 特殊处理三个业务字段，将数组内容合并到名称中
          if (field.listField && expense[field.listField]) {
            // 确保是数组类型
            const listData = Array.isArray(expense[field.listField])
              ? expense[field.listField]
              : [expense[field.listField]];

            if (listData.length > 0) {
              feeName = `${field.name}(${listData.join(', ')})`;
            }
          }

          const feeItem: any = {
            name: feeName,
            amount: expense[field.amountField],
          };

          // 如果存在日期字段，添加到返回数据中（统一转换为ISO格式）
          if (field.startDateField && expense[field.startDateField]) {
            const startDate = new Date(expense[field.startDateField]);
            feeItem.startDate = startDate.toISOString();
          }

          if (field.endDateField && expense[field.endDateField]) {
            const endDate = new Date(expense[field.endDateField]);
            feeItem.endDate = endDate.toISOString();
          }

          feeItems.push(feeItem);
        }
      }

      // 统一处理收费日期格式
      let formattedChargeDate = null;
      if (expense.chargeDate) {
        formattedChargeDate = new Date(expense.chargeDate).toISOString();
      }

      return {
        id: expense.id,
        companyName: expense.companyName,
        chargeDate: formattedChargeDate,
        // 根据审核状态决定是否返回收据编号
        receiptNo: expense.status === 1 ? expense.receiptNo : '',
        totalFee: expense.totalFee,
        chargeMethod: expense.chargeMethod,
        remarks: expense.receiptRemarks,
        feeItems,
      };
    } catch (error) {
      // 记录错误日志
      console.error('查看收据出错:', error);

      // 重新抛出适当的异常
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else {
        throw new BadRequestException(`查看收据失败: ${error.message}`);
      }
    }
  }

  async getAutocompleteOptions(field: string) {
    const allowedFields = [
      'companyName',
      'companyType',
      'companyLocation',
      'businessType',
      'salesperson',
    ];

    if (!allowedFields.includes(field)) {
      throw new BadRequestException(`不支持的字段: ${field}`);
    }

    // 获取字段的唯一值
    const query = `SELECT DISTINCT ${field} FROM sys_expense WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`;
    const results = await this.expenseRepository.query(query);

    // 提取字段值
    return results.map((item) => item[field]);
  }

  async exportToCsv(query: ExportExpenseDto, userId: number): Promise<string> {
    // 获取权限过滤条件
    const permissionFilter =
      await this.expensePermissionService.buildExpenseQueryFilter(userId);

    // 创建查询构建器
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    // 首先应用权限过滤条件
    if (Array.isArray(permissionFilter)) {
      if (permissionFilter.length === 0) {
        // 如果没有任何权限，返回空结果
        return '\uFEFF'; // 返回空的CSV，只有BOM标记
      }

      // 处理多个OR条件的权限过滤
      const permissionWhere = permissionFilter.map((filter, index) => {
        const params = {};
        let whereClause = '';

        Object.entries(filter).forEach(([key, value]) => {
          if (whereClause) whereClause += ' AND ';
          const paramKey = `permission_${key}_${index}`;
          whereClause += `expense.${key} = :${paramKey}`;
          params[paramKey] = value;
        });

        if (whereClause) {
          queryBuilder.orWhere(`(${whereClause})`, params);
        }
      });
    } else {
      // 处理单一权限过滤条件
      const params = {};
      let whereClause = '';

      Object.entries(permissionFilter).forEach(([key, value]) => {
        if (whereClause) whereClause += ' AND ';
        const paramKey = `permission_${key}`;
        whereClause += `expense.${key} = :${paramKey}`;
        params[paramKey] = value;
      });

      if (whereClause) {
        queryBuilder.where(whereClause, params);
      }
    }

    // 然后在权限过滤的基础上应用查询参数
    if (query.companyName !== undefined) {
      if (query.companyName === '') {
        queryBuilder.andWhere(
          "(expense.companyName IS NULL OR expense.companyName = '')",
        );
      } else {
        queryBuilder.andWhere('expense.companyName LIKE :companyName', {
          companyName: `%${query.companyName}%`,
        });
      }
    }

    if (query.unifiedSocialCreditCode !== undefined) {
      if (query.unifiedSocialCreditCode === '') {
        queryBuilder.andWhere(
          "(expense.unifiedSocialCreditCode IS NULL OR expense.unifiedSocialCreditCode = '')",
        );
      } else {
        queryBuilder.andWhere(
          'expense.unifiedSocialCreditCode LIKE :unifiedSocialCreditCode',
          { unifiedSocialCreditCode: `%${query.unifiedSocialCreditCode}%` },
        );
      }
    }

    if (query.companyType !== undefined) {
      if (query.companyType === '') {
        queryBuilder.andWhere(
          "(expense.companyType IS NULL OR expense.companyType = '')",
        );
      } else {
        queryBuilder.andWhere('expense.companyType = :companyType', {
          companyType: query.companyType,
        });
      }
    }

    if (query.companyLocation !== undefined) {
      if (query.companyLocation === '') {
        queryBuilder.andWhere(
          "(expense.companyLocation IS NULL OR expense.companyLocation = '')",
        );
      } else {
        queryBuilder.andWhere('expense.companyLocation = :companyLocation', {
          companyLocation: query.companyLocation,
        });
      }
    }

    if (query.businessType !== undefined) {
      if (query.businessType === '') {
        queryBuilder.andWhere(
          "(expense.businessType IS NULL OR expense.businessType = '')",
        );
      } else {
        // 处理多选业务类型筛选
        const businessTypes = Array.isArray(query.businessType) 
          ? query.businessType 
          : [query.businessType];
        
        if (businessTypes.length > 0) {
          const conditions = businessTypes.map((type, index) => 
            `expense.businessType LIKE :businessTypeExport${index}`
          );
          const params = {};
          businessTypes.forEach((type, index) => {
            params[`businessTypeExport${index}`] = `%${type}%`;
          });
          
          queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
        }
      }
    }

    if (query.socialInsuranceBusinessType !== undefined) {
      if (query.socialInsuranceBusinessType === '') {
        queryBuilder.andWhere(
          "(expense.socialInsuranceBusinessType IS NULL OR expense.socialInsuranceBusinessType = '')",
        );
      } else {
        // 处理多选社保代理业务类型筛选
        const socialInsuranceBusinessTypes = Array.isArray(query.socialInsuranceBusinessType) 
          ? query.socialInsuranceBusinessType 
          : [query.socialInsuranceBusinessType];
        
        if (socialInsuranceBusinessTypes.length > 0) {
          const conditions = socialInsuranceBusinessTypes.map((type, index) => 
            `expense.socialInsuranceBusinessType LIKE :socialInsuranceBusinessTypeExport${index}`
          );
          const params = {};
          socialInsuranceBusinessTypes.forEach((type, index) => {
            params[`socialInsuranceBusinessTypeExport${index}`] = `%${type}%`;
          });
          
          queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
        }
      }
    }

    if (query.status !== undefined) {
      queryBuilder.andWhere('expense.status = :status', {
        status: query.status,
      });
    }

    if (query.salesperson !== undefined) {
      if (query.salesperson === '') {
        queryBuilder.andWhere(
          "(expense.salesperson IS NULL OR expense.salesperson = '')",
        );
      } else {
        queryBuilder.andWhere('expense.salesperson LIKE :salesperson', {
          salesperson: `%${query.salesperson}%`,
        });
      }
    }

    if (query.chargeMethod !== undefined) {
      if (query.chargeMethod === '') {
        queryBuilder.andWhere(
          "(expense.chargeMethod IS NULL OR expense.chargeMethod = '')",
        );
      } else {
        queryBuilder.andWhere('expense.chargeMethod LIKE :chargeMethod', {
          chargeMethod: `%${query.chargeMethod}%`,
        });
      }
    }

    if (query.receiptNo !== undefined) {
      if (query.receiptNo === '') {
        queryBuilder.andWhere(
          "(expense.receiptNo IS NULL OR expense.receiptNo = '')",
        );
      } else {
        queryBuilder.andWhere('expense.receiptNo LIKE :receiptNo', {
          receiptNo: `%${query.receiptNo}%`,
        });
      }
    }

    if (query.auditor !== undefined) {
      if (query.auditor === '') {
        queryBuilder.andWhere(
          "(expense.auditor IS NULL OR expense.auditor = '')",
        );
      } else {
        queryBuilder.andWhere('expense.auditor LIKE :auditor', {
          auditor: `%${query.auditor}%`,
        });
      }
    }

    if (query.chargeDateStart && query.chargeDateEnd) {
      queryBuilder.andWhere(
        'expense.chargeDate BETWEEN :startDate AND :endDate',
        { startDate: query.chargeDateStart, endDate: query.chargeDateEnd },
      );
    } else if (query.chargeDateStart) {
      queryBuilder.andWhere('expense.chargeDate >= :startDate', {
        startDate: query.chargeDateStart,
      });
    } else if (query.chargeDateEnd) {
      queryBuilder.andWhere('expense.chargeDate <= :endDate', {
        endDate: query.chargeDateEnd,
      });
    }

    // 添加对创建日期范围的处理
    if (query.startDate && query.endDate) {
      // 创建日期对象
      const startDate = new Date(query.startDate);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'expense.createdAt BETWEEN :createdStartDate AND :createdEndDate',
        {
          createdStartDate: startDate,
          createdEndDate: endDate,
        },
      );

      console.log(
        `导出日期查询范围: ${startDate.toISOString()} - ${endDate.toISOString()}`,
      );
    }

    // 添加对审核日期范围的处理
    if (query.auditDateStart && query.auditDateEnd) {
      // 创建审核日期对象
      const auditStartDate = new Date(query.auditDateStart);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const auditEndDate = new Date(query.auditDateEnd);
      auditEndDate.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'expense.auditDate BETWEEN :auditStartDate AND :auditEndDate',
        {
          auditStartDate: auditStartDate,
          auditEndDate: auditEndDate,
        },
      );

      console.log(
        `导出审核日期查询范围: ${auditStartDate.toISOString()} - ${auditEndDate.toISOString()}`,
      );
    } else if (query.auditDateStart) {
      queryBuilder.andWhere('expense.auditDate >= :auditStartDate', {
        auditStartDate: new Date(query.auditDateStart),
      });
    } else if (query.auditDateEnd) {
      const auditEndDate = new Date(query.auditDateEnd);
      auditEndDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('expense.auditDate <= :auditEndDate', {
        auditEndDate: auditEndDate,
      });
    }

    // 业务查询筛选逻辑（支持多选）
    if (query.businessInquiry !== undefined && query.businessInquiry !== '') {
      // 处理多选业务查询筛选
      const businessInquiries = Array.isArray(query.businessInquiry) 
        ? query.businessInquiry 
        : [query.businessInquiry];
      
      if (businessInquiries.length > 0) {
        // 使用统一的方法构建查询条件
        const { conditions, params } = await this.buildBusinessInquiryConditions(businessInquiries);
        
        // 如果有条件，使用OR连接所有条件（多选是或的关系）
        if (conditions.length > 0) {
          queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
        }
        
        console.log(`导出业务查询 - 搜索值: ${businessInquiries.join(', ')}`);
      }
    }

    // 查询数据
    const expenses = await queryBuilder.orderBy('expense.id', 'DESC').getMany();

    // 定义CSV字段映射 - 按照用户要求的顺序排列
    const fieldMapping = {
      companyLocation: '企业归属地',
      salesperson: '业务员',
      agencyType: '代理类型',
      companyName: '企业名称',
      businessType: '业务类型',
      giftAgencyDuration: '赠送详情',
      agencyFee: '代理费',
      licenseFee: '办照费用',
      socialInsuranceBusinessType: '社保代理业务类型',
      socialInsuranceAgencyFee: '社保代理费',
      housingFundAgencyFee: '公积金代理费',
      statisticalReportFee: '统计局报表费',
      customerDataOrganizationFee: '客户资料整理费',
      changeFee: '变更收费',
      administrativeLicenseFee: '行政许可收费',
      otherBusiness: '其他业务(基础)',
      otherBusinessFee: '其他业务收费(基础)',
      basicBusinessPerformance: '基础业绩合计',
      brandFee: '牌子费',
      generalSealFee: '一般刻章费用',
      accountingSoftwareFee: '记账软件费',
      invoiceSoftwareFee: '开票软件费',
      addressFee: '地址费',
      otherBusinessOutsourcing: '其他业务',
      otherBusinessOutsourcingFee: '其他业务收费',
      outsourcingBusinessPerformance: '外包业绩合计',
      otherBusinessSpecial: '其他业务(特殊)',
      otherBusinessSpecialFee: '其他业务收费(特殊)',
      totalFeeExcludeRecordSeal: '总费用',
      businessCommissionOwn: '基础业务提成',
      businessCommissionOutsource: '外包业务提成',
      specialBusinessCommission: '特殊业务提成',
      agencyCommission: '代理费提成',
      createdAt: '创建时间',
    };

    // 处理导出数据
    const exportData = expenses.map((expense) => {
      // 使用any类型来避免类型错误
      const item: any = { ...expense };

      // 计算总费用（除备案章费用）
      const totalFee = parseFloat(item.totalFee) || 0;
      const recordSealFee = parseFloat(item.recordSealFee) || 0;
      item.totalFeeExcludeRecordSeal = totalFee - recordSealFee;

      // 格式化创建时间为YYYY-MM-DD
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        item.createdAt = date.toISOString().split('T')[0];
      }

      // 处理字符串数组类型字段
      ['otherBusiness', 'otherBusinessOutsourcing', 'otherBusinessSpecial'].forEach((field) => {
        if (item[field] && Array.isArray(item[field])) {
          item[field] = item[field].join(',');
        }
      });

      // 处理businessType字段的显示逻辑
      if (item.businessType === '新增') {
        item.businessType = '业务办理-新增';
      } else if (!item.businessType || item.businessType === '') {
        item.businessType = '业务办理-其他';
      }
      // 续费保持不变

      return item;
    });

    // 创建字段标题
    const fields = Object.keys(fieldMapping).map((field) => ({
      label: fieldMapping[field],
      value: field,
    }));

    // 使用json2csv转换数据
    try {
      const parser = new Parser({ fields });
      // 添加UTF-8 BOM标记确保Excel正确识别中文
      return '\uFEFF' + parser.parse(exportData);
    } catch (err) {
      throw new BadRequestException(`导出CSV失败: ${err.message}`);
    }
  }

  // 查找数组中指定属性的最大日期
  private findMaxDate(expenses: Expense[], dateField: string): string | null {
    let maxDate = null;

    for (const expense of expenses) {
      const dateValue = expense[dateField];
      if (dateValue) {
        const currentDate = new Date(dateValue);
        if (!maxDate || currentDate > new Date(maxDate)) {
          maxDate = dateValue;
        }
      }
    }

    return maxDate;
  }

  // 计算指定日期的下一天
  private getNextDay(dateString: string): string {
    try {
      // 确保是字符串类型
      const dateStr = String(dateString);
      console.log(`正在处理日期: ${dateStr}`);

      // 创建日期对象
      const date = new Date(dateStr);

      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        console.error(`无效的日期字符串: ${dateStr}`);
        return '';
      }

      console.log(`原始日期对象: ${date.toISOString()}`);

      // 获取年、月、日
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      // 创建新的日期对象，设置为下一天
      const nextDay = new Date(year, month, day + 1);
      console.log(`计算得到的下一天: ${nextDay.toISOString()}`);

      // 格式化为YYYY-MM-DD格式
      const nextYear = nextDay.getFullYear();
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nextDayOfMonth = String(nextDay.getDate()).padStart(2, '0');

      const result = `${nextYear}-${nextMonth}-${nextDayOfMonth}`;
      console.log(`格式化后的结果: ${result}`);

      return result;
    } catch (error) {
      console.error(`日期处理出错: ${error.message}`);
      return '';
    }
  }

  // 计算指定日期的下个月
  private getNextMonth(dateString: string): string {
    try {
      // 确保是字符串类型
      const dateStr = String(dateString);
      console.log(`正在处理日期(下个月): ${dateStr}`);

      // 创建日期对象
      const date = new Date(dateStr);

      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        console.error(`无效的日期字符串: ${dateStr}`);
        return '';
      }

      console.log(`原始日期对象: ${date.toISOString()}`);

      // 获取年、月、日
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      // 创建新的日期对象，设置为下个月同一天
      const nextMonth = new Date(year, month + 1, day);

      // 处理月末问题（例如1月31日的下个月应该是2月28/29日）
      // 如果计算的下个月日期的月份不是期望的月份+1，说明发生了溢出
      // 例如：3月31日 + 1个月 = 5月1日（错误，应该是4月30日）
      if (nextMonth.getMonth() !== (month + 1) % 12) {
        // 设置为该月的最后一天
        nextMonth.setDate(0); // 设置为上个月的最后一天
      }

      console.log(`计算得到的下个月: ${nextMonth.toISOString()}`);

      // 格式化为YYYY-MM-DD格式
      const nextYear = nextMonth.getFullYear();
      const nextMonthNum = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const nextDayOfMonth = String(nextMonth.getDate()).padStart(2, '0');

      const result = `${nextYear}-${nextMonthNum}-${nextDayOfMonth}`;
      console.log(`格式化后的结果: ${result}`);

      return result;
    } catch (error) {
      console.error(`日期处理出错: ${error.message}`);
      return '';
    }
  }

  // 获取企业最大日期的下个月
  async getMaxDatesNextDay(params: {
    companyName?: string;
    unifiedSocialCreditCode?: string;
  }) {
    console.log('获取最大日期的下个月，参数:', params);

    // 至少需要提供一个查询条件
    if (!params.companyName && !params.unifiedSocialCreditCode) {
      throw new BadRequestException('必须提供企业名称或统一社会信用代码');
    }

    // 构建查询条件
    const where: FindOptionsWhere<Expense> = {
      // 只获取已审核的记录(status = 1)
      status: 1,
    };

    if (params.companyName) {
      where.companyName = params.companyName;
    }

    if (params.unifiedSocialCreditCode) {
      where.unifiedSocialCreditCode = params.unifiedSocialCreditCode;
    }

    // 查询这个企业的所有已审核记录
    const expenses = await this.expenseRepository.find({
      where,
      order: { id: 'DESC' },
    });

    if (expenses.length === 0) {
      console.log('未找到企业已审核记录');
      throw new NotFoundException('未找到相关企业的已审核费用记录');
    }

    console.log(`找到 ${expenses.length} 条已审核记录`);

    // 需要计算的日期字段列表
    const dateFields = [
      'agencyEndDate',
      'accountingSoftwareEndDate',
      'invoiceSoftwareEndDate',
      'socialInsuranceEndDate',
      'housingFundEndDate',
      'statisticalEndDate',
      'organizationEndDate',
      'addressEndDate',
      'onlineBankingCustodyEndDate',
    ];

    // 结果对象
    const result = {
      companyName: expenses[0].companyName,
      unifiedSocialCreditCode: expenses[0].unifiedSocialCreditCode,
      dates: {},
    };

    // 计算每个日期字段的最大值和下个月
    for (const field of dateFields) {
      const maxDate = this.findMaxDate(expenses, field);
      const startFieldName = field.replace('EndDate', 'StartDate');

      if (maxDate) {
        const nextMonth = this.getNextMonth(maxDate);
        result.dates[startFieldName] = nextMonth;
      } else {
        result.dates[startFieldName] = null;
      }
    }

    return result;
  }

  /**
   * 查询特殊业务费用记录列表
   */
  async findSpecialExpenses(query: any) {
    const { page = 1, pageSize = 10, salesperson, startDate, endDate, companyName } = query;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereConditions = ['status = 1']; // 只查询已审核的记录
    let params = [];
    
    // 查询有特殊业务的记录（有特殊业务内容、特殊业务费用或特殊业务提成）
    const specialBusinessCondition = [
      '(otherBusinessSpecial IS NOT NULL AND JSON_LENGTH(otherBusinessSpecial) > 0)',
      '(otherBusinessSpecialFee IS NOT NULL AND otherBusinessSpecialFee > 0)',
      '(specialBusinessCommission IS NOT NULL AND specialBusinessCommission > 0)'
    ].join(' OR ');
    whereConditions.push(`(${specialBusinessCondition})`);
    
    if (salesperson) {
      whereConditions.push('salesperson = ?');
      params.push(salesperson);
    }
    
    if (startDate) {
      whereConditions.push('chargeDate >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('chargeDate <= ?');
      params.push(endDate);
    }
    
    if (companyName) {
      whereConditions.push('companyName LIKE ?');
      params.push(`%${companyName}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM sys_expense WHERE ${whereClause}`;
    const [countResult] = await this.dataSource.query(countQuery, params);
    const total = countResult.total;
    
    // 查询数据
    const dataQuery = `
      SELECT 
        id,
        companyName,
        salesperson,
        chargeDate,
        otherBusinessSpecial,
        otherBusinessSpecialFee,
        specialBusinessCommission,
        totalFee,
        businessType,
        auditor,
        auditDate
      FROM sys_expense 
      WHERE ${whereClause}
      ORDER BY chargeDate DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    
    const expenses = await this.dataSource.query(dataQuery, [...params, pageSize, offset]);
    
    return {
      data: expenses,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    };
  }


}
