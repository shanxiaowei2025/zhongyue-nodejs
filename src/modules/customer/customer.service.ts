// 服务文件包含业务逻辑的具体实现
// 主要功能：
// 1. 实现数据库操作（增删改查）
// 2. 处理业务逻辑
// 3. 数据转换和处理
// 4. 错误处理
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { SearchCustomerArchiveDto } from './dto/search-customer-archive.dto';
import { CustomerPermissionService } from './services/customer-permission.service';
import { User } from '../users/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExportCustomerDto } from './dto/export-customer.dto';
import * as os from 'os';
import { ConfigService } from '@nestjs/config';
import { ServiceHistoryService } from '../enterprise-service/service-history/service-history.service';
import { CustomerLevelHistoryService } from '../reports/customer-level-history/customer-level-history.service';

const execPromise = promisify(exec);

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private customerPermissionService: CustomerPermissionService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private configService: ConfigService,
    private serviceHistoryService: ServiceHistoryService,
    private customerLevelHistoryService: CustomerLevelHistoryService,
  ) {}

  // 创建客户
  async create(createCustomerDto: CreateCustomerDto, userId: number) {
    console.log(`用户 ${userId} 尝试创建客户`);

    // 检查权限 - 创建操作只需要创建权限
    const hasPermission =
      await this.customerPermissionService.hasCustomerCreatePermission(userId);
    console.log(`用户 ${userId} 创建权限检查结果: ${hasPermission}`);

    if (!hasPermission) {
      console.log(`用户 ${userId} 无权创建客户，抛出异常`);
      throw new ForbiddenException('没有创建客户的权限');
    }

    // 检查统一社会信用代码是否已存在
    if (createCustomerDto.unifiedSocialCreditCode) {
      const existingCustomer = await this.customerRepository.findOne({
        where: {
          unifiedSocialCreditCode: createCustomerDto.unifiedSocialCreditCode,
        },
      });

      if (existingCustomer) {
        throw new ForbiddenException(
          `统一社会信用代码 ${createCustomerDto.unifiedSocialCreditCode} 已存在，不能重复创建`,
        );
      }
    }

    // 检查公司名称是否已存在
    if (createCustomerDto.companyName) {
      const existingCustomerByName = await this.customerRepository.findOne({
        where: { companyName: createCustomerDto.companyName },
      });

      if (existingCustomerByName) {
        throw new ForbiddenException(
          `公司名称 ${createCustomerDto.companyName} 已存在，不能重复创建`,
        );
      }
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department'],
    });

    if (!user) {
      throw new ForbiddenException('用户不存在');
    }

    // 处理 followUpRecords 智能时间填充
    const processedDto = { ...createCustomerDto };
    if (processedDto.followUpRecords && processedDto.followUpRecords.length > 0) {
      processedDto.followUpRecords = processedDto.followUpRecords.map(record => {
        // 如果记录只有 text 没有 datetime，自动填充当前时间
        if (record.text && !record.datetime) {
          return {
            ...record,
            datetime: new Date().toISOString()
          };
        }
        return record;
      });
      
      this.logger.log(`为新客户的跟进记录自动填充时间，共处理 ${processedDto.followUpRecords.length} 条记录`);
    }

    // 创建客户实体
    const customer = this.customerRepository.create(processedDto);

    // 保存客户信息
    const savedCustomer = await this.customerRepository.save(customer);

    try {
      // 创建服务历程记录
      await this.serviceHistoryService.createFromCustomer(savedCustomer);
      this.logger.log(`已为客户 ${savedCustomer.companyName} 创建服务历程记录`);
    } catch (error) {
      this.logger.error(`创建服务历程记录失败: ${error.message}`, error.stack);
      // 不阻止客户创建的主流程，即使服务历程创建失败
    }

    return savedCustomer;
  }

  // 查询客户列表
  async findAll(query: QueryCustomerDto, userId: number) {
    const {
      keyword,
      unifiedSocialCreditCode,
      consultantAccountant,
      bookkeepingAccountant,
      taxBureau,
      enterpriseType,
      industryCategory,
      enterpriseStatus,
      businessStatus,
      customerLevel,
      location,
      clanId,
      startDate,
      endDate,
      contributorName,
      licenseType,
      followUpKeyword,
      page = 1,
      pageSize = 10,
    } = query;

    // 创建查询构建器
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // 检查用户权限：只有拥有查看全部权限的用户才能查看流失和已注销的客户
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'roles'],
    });

    const isAdmin =
      user &&
      user.roles &&
      (user.roles.includes('admin') || user.roles.includes('super_admin'));

    // 检查用户是否有查看全部客户的权限
    const hasViewAllPermission = await this.customerPermissionService.hasCustomerViewAllPermission(userId);

    // 如果用户既不是管理员，也没有查看全部的权限，且用户没有明确指定状态查询条件时，自动排除流失和已注销的客户
    if (!isAdmin && !hasViewAllPermission) {
      // 只有在用户没有明确查询 businessStatus 时，才自动排除 lost 状态
      if (businessStatus === undefined) {
        queryBuilder.andWhere(
          '(customer.businessStatus != :lostStatus OR customer.businessStatus IS NULL)',
          { lostStatus: 'lost' },
        );
      }
      
      // 只有在用户没有明确查询 enterpriseStatus 时，才自动排除 cancelled 状态
      if (enterpriseStatus === undefined) {
        queryBuilder.andWhere(
          '(customer.enterpriseStatus != :cancelledStatus OR customer.enterpriseStatus IS NULL)',
          { cancelledStatus: 'cancelled' },
        );
      }
    }

    // 添加基础查询条件
    if (keyword !== undefined) {
      if (keyword === '') {
        queryBuilder.andWhere(
          "(customer.companyName IS NULL OR customer.companyName = '')",
        );
      } else {
        queryBuilder.andWhere('customer.companyName LIKE :keyword', {
          keyword: `%${keyword}%`,
        });
      }
    }

    if (unifiedSocialCreditCode !== undefined) {
      if (unifiedSocialCreditCode === '') {
        queryBuilder.andWhere(
          "(customer.unifiedSocialCreditCode IS NULL OR customer.unifiedSocialCreditCode = '')",
        );
      } else {
        queryBuilder.andWhere(
          'customer.unifiedSocialCreditCode LIKE :unifiedSocialCreditCode',
          {
            unifiedSocialCreditCode: `%${unifiedSocialCreditCode}%`,
          },
        );
      }
    }

    if (consultantAccountant !== undefined) {
      if (consultantAccountant === '') {
        queryBuilder.andWhere(
          "(customer.consultantAccountant IS NULL OR customer.consultantAccountant = '')",
        );
      } else {
        queryBuilder.andWhere(
          'customer.consultantAccountant LIKE :consultantAccountant',
          {
            consultantAccountant: `%${consultantAccountant}%`,
          },
        );
      }
    }

    if (bookkeepingAccountant !== undefined) {
      if (bookkeepingAccountant === '') {
        queryBuilder.andWhere(
          "(customer.bookkeepingAccountant IS NULL OR customer.bookkeepingAccountant = '')",
        );
      } else {
        queryBuilder.andWhere(
          'customer.bookkeepingAccountant LIKE :bookkeepingAccountant',
          {
            bookkeepingAccountant: `%${bookkeepingAccountant}%`,
          },
        );
      }
    }

    if (taxBureau !== undefined) {
      if (taxBureau === '') {
        queryBuilder.andWhere(
          "(customer.taxBureau IS NULL OR customer.taxBureau = '')",
        );
      } else {
        queryBuilder.andWhere('customer.taxBureau LIKE :taxBureau', {
          taxBureau: `%${taxBureau}%`,
        });
      }
    }

    if (enterpriseType !== undefined) {
      if (enterpriseType === '') {
        // 如果参数值为空字符串，则查询字段为 NULL 的记录
        queryBuilder.andWhere(
          "(customer.enterpriseType IS NULL OR customer.enterpriseType = '')",
        );
      } else {
        // 处理多选企业类型筛选
        const enterpriseTypes = Array.isArray(enterpriseType) 
          ? enterpriseType 
          : [enterpriseType];
        
        if (enterpriseTypes.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = enterpriseTypes.some(type => 
            type === '' || type === null || type === undefined || type === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(customer.enterpriseType IS NULL OR customer.enterpriseType = '')");
          }
          
          // 处理非空值
          enterpriseTypes.forEach((type) => {
            if (type !== '' && type !== null && type !== undefined && type !== 'null') {
              conditions.push(`customer.enterpriseType LIKE :enterpriseType${paramIndex}`);
              params[`enterpriseType${paramIndex}`] = `%${type}%`;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (industryCategory !== undefined) {
      if (industryCategory === '') {
        queryBuilder.andWhere(
          "(customer.industryCategory IS NULL OR customer.industryCategory = '')",
        );
      } else {
        queryBuilder.andWhere(
          'customer.industryCategory LIKE :industryCategory',
          {
            industryCategory: `%${industryCategory}%`,
          },
        );
      }
    }

    if (enterpriseStatus !== undefined) {
      if (enterpriseStatus === '') {
        queryBuilder.andWhere(
          "(customer.enterpriseStatus IS NULL OR customer.enterpriseStatus = '')",
        );
      } else {
        // 处理多选企业状态筛选
        const enterpriseStatuses = Array.isArray(enterpriseStatus) 
          ? enterpriseStatus 
          : [enterpriseStatus];
        
        if (enterpriseStatuses.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = enterpriseStatuses.some(status => 
            status === '' || status === null || status === undefined || status === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(customer.enterpriseStatus IS NULL OR customer.enterpriseStatus = '')");
          }
          
          // 处理非空值
          enterpriseStatuses.forEach((status) => {
            if (status !== '' && status !== null && status !== undefined && status !== 'null') {
              conditions.push(`customer.enterpriseStatus = :enterpriseStatus${paramIndex}`);
              params[`enterpriseStatus${paramIndex}`] = status;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (customerLevel !== undefined) {
      if (customerLevel === '') {
        queryBuilder.andWhere(
          "(customer.customerLevel IS NULL OR customer.customerLevel = '')",
        );
      } else {
        // 处理多选客户等级筛选
        const customerLevels = Array.isArray(customerLevel) 
          ? customerLevel 
          : [customerLevel];
        
        if (customerLevels.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = customerLevels.some(level => 
            level === '' || level === null || level === undefined || level === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(customer.customerLevel IS NULL OR customer.customerLevel = '')");
          }
          
          // 处理非空值
          customerLevels.forEach((level) => {
            if (level !== '' && level !== null && level !== undefined && level !== 'null') {
              conditions.push(`customer.customerLevel = :customerLevel${paramIndex}`);
              params[`customerLevel${paramIndex}`] = level;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (businessStatus !== undefined) {
      if (businessStatus === '') {
        queryBuilder.andWhere(
          "(customer.businessStatus IS NULL OR customer.businessStatus = '')",
        );
      } else {
        // 处理多选业务状态筛选
        const businessStatuses = Array.isArray(businessStatus) 
          ? businessStatus 
          : [businessStatus];
        
        if (businessStatuses.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = businessStatuses.some(status => 
            status === '' || status === null || status === undefined || status === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(customer.businessStatus IS NULL OR customer.businessStatus = '')");
          }
          
          // 处理非空值
          businessStatuses.forEach((status) => {
            if (status !== '' && status !== null && status !== undefined && status !== 'null') {
              conditions.push(`customer.businessStatus = :businessStatus${paramIndex}`);
              params[`businessStatus${paramIndex}`] = status;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (location !== undefined) {
      if (location === '') {
        queryBuilder.andWhere(
          "(customer.location IS NULL OR customer.location = '')",
        );
      } else {
        // 处理多选归属地筛选
        const locations = Array.isArray(location) 
          ? location 
          : [location];
        
        if (locations.length > 0) {
          const conditions = [];
          const params = {};
          let paramIndex = 0;
          
          // 检查是否包含空值或null值
          const hasEmptyValue = locations.some(loc => 
            loc === '' || loc === null || loc === undefined || loc === 'null'
          );
          
          // 如果包含空值，添加NULL或空字符串的条件
          if (hasEmptyValue) {
            conditions.push("(customer.location IS NULL OR customer.location = '')");
          }
          
          // 处理非空值
          locations.forEach((loc) => {
            if (loc !== '' && loc !== null && loc !== undefined && loc !== 'null') {
              conditions.push(`customer.location LIKE :location${paramIndex}`);
              params[`location${paramIndex}`] = `%${loc}%`;
              paramIndex++;
            }
          });
          
          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
          }
        }
      }
    }

    if (clanId !== undefined) {
      if (clanId === null || clanId === 0) {
        queryBuilder.andWhere('customer.clanId IS NULL');
      } else {
        queryBuilder.andWhere('customer.clanId = :clanId', {
          clanId: clanId,
        });
      }
    }

    // 添加对JSON字段的搜索条件
    if (contributorName !== undefined) {
      if (contributorName === '') {
        queryBuilder.andWhere(
          "(customer.paidInCapital IS NULL OR JSON_LENGTH(customer.paidInCapital) = 0 OR customer.paidInCapital = '')",
        );
      } else {
        // MySQL中搜索JSON数组中的对象字段
        queryBuilder.andWhere(
          `JSON_SEARCH(JSON_EXTRACT(customer.paidInCapital, '$[*].name'), 'one', :contributorName) IS NOT NULL`,
          {
            contributorName: `%${contributorName}%`,
          },
        );
      }
    }

    if (licenseType !== undefined) {
      if (licenseType === '') {
        queryBuilder.andWhere(
          "(customer.administrativeLicense IS NULL OR JSON_LENGTH(customer.administrativeLicense) = 0 OR customer.administrativeLicense = '')",
        );
      } else {
        // MySQL中搜索JSON数组中的对象字段
        queryBuilder.andWhere(
          `JSON_SEARCH(JSON_EXTRACT(customer.administrativeLicense, '$[*].licenseType'), 'one', :licenseType) IS NOT NULL`,
          {
            licenseType: `%${licenseType}%`,
          },
        );
      }
    }

    if (startDate && endDate) {
      // 创建日期对象
      const start = new Date(startDate);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'customer.createTime BETWEEN :startDate AND :endDate',
        {
          startDate: start,
          endDate: end,
        },
      );

      console.log(
        `客户查询日期范围: ${start.toISOString()} - ${end.toISOString()}`,
      );
    }

    // 获取权限过滤条件
    const permissionConditions =
      await this.customerPermissionService.buildCustomerQueryFilter(userId);

    console.log('权限条件:', permissionConditions);

    // 处理权限条件
    if (Array.isArray(permissionConditions)) {
      // 如果是数组，说明有多个 OR 条件
      // 检查是否包含空对象（表示无限制条件）
      if (
        !permissionConditions.some(
          (condition) => Object.keys(condition).length === 0,
        )
      ) {
        // 如果没有空对象，添加权限条件
        const allParams = {};
        const orConditions = permissionConditions.map((condition, index) => {
          const conditions = [];

          Object.entries(condition).forEach(([key, value]) => {
            const paramKey = `perm_${key}_${index}`;
            allParams[paramKey] = value;
            conditions.push(`customer.${key} = :${paramKey}`);
          });

          return conditions.join(' AND ');
        });

        if (orConditions.length > 0) {
          queryBuilder.andWhere(`(${orConditions.join(' OR ')})`);
          queryBuilder.setParameters(allParams);
          console.log('设置的参数:', allParams);
        }
      }
    } else if (Object.keys(permissionConditions).length > 0) {
      // 如果不是数组且不是空对象，添加权限条件
      Object.entries(permissionConditions).forEach(([key, value]) => {
        queryBuilder.andWhere(`customer.${key} = :${key}`, { [key]: value });
      });
    }

    // 跟进记录搜索
    if (followUpKeyword !== undefined && followUpKeyword !== '') {
      queryBuilder.andWhere(
        "JSON_SEARCH(customer.followUpRecords, 'all', :followUpKeyword) IS NOT NULL",
        { followUpKeyword: `%${followUpKeyword}%` }
      );
    }

    console.log('最终SQL:', queryBuilder.getSql());
    console.log('最终参数:', queryBuilder.getParameters());

    // 添加分页和排序
    queryBuilder
      .orderBy('customer.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 执行查询
    const [items, total] = await queryBuilder.getManyAndCount();

    // 返回查询结果
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 查询单个客户
  async findOne(id: number, userId: number) {
    // 检查用户是否是管理员或超级管理员
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'roles'],
    });

    const isAdmin =
      user &&
      user.roles &&
      (user.roles.includes('admin') || user.roles.includes('super_admin'));

    // 先检查用户是否有权限查看任何客户
    const permissionConditions =
      await this.customerPermissionService.buildCustomerQueryFilter(userId);

    if (
      !Array.isArray(permissionConditions) &&
      permissionConditions.id === -1
    ) {
      // 如果权限条件是 {id: -1}，说明用户没有任何查看权限
      throw new ForbiddenException('您没有权限查看客户信息');
    }

    // 查询客户信息
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    // 如果不是管理员，检查是否可以查看该状态的客户
    if (
      !isAdmin &&
      (customer.businessStatus === 'lost' ||
        customer.enterpriseStatus === 'cancelled')
    ) {
      throw new ForbiddenException('您没有权限查看该客户信息');
    }

    // 根据权限过滤条件检查用户是否有权限查看此客户
    if (Array.isArray(permissionConditions)) {
      // 如果有多个条件，检查是否至少满足一个
      const hasPermission = permissionConditions.some((condition) => {
        // 空对象条件表示无限制，直接通过
        if (Object.keys(condition).length === 0) {
          return true;
        }

        // 检查是否满足所有子条件
        return Object.entries(condition).every(
          ([key, value]) => customer[key] === value,
        );
      });

      if (!hasPermission) {
        throw new ForbiddenException('您没有权限查看此客户');
      }
    } else if (Object.keys(permissionConditions).length > 0) {
      // 如果只有一个条件对象，检查是否满足所有子条件
      const hasPermission = Object.entries(permissionConditions).every(
        ([key, value]) => customer[key] === value,
      );

      if (!hasPermission) {
        throw new ForbiddenException('您没有权限查看此客户');
      }
    }

    return customer;
  }

  // 更新客户
  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    userId: number,
  ) {
    // 检查权限 - 更新操作只需要编辑权限
    const hasPermission =
      await this.customerPermissionService.hasCustomerUpdatePermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有更新客户的权限');
    }

    // 先查找客户，检查是否存在
    const existingCustomer = await this.findOne(id, userId);

    // 如果更新了统一社会信用代码，检查是否与其他客户重复
    if (
      updateCustomerDto.unifiedSocialCreditCode &&
      updateCustomerDto.unifiedSocialCreditCode !==
        existingCustomer.unifiedSocialCreditCode
    ) {
      const duplicateCustomer = await this.customerRepository.findOne({
        where: {
          unifiedSocialCreditCode: updateCustomerDto.unifiedSocialCreditCode,
          id: Not(id), // 排除当前客户自身
        },
      });

      if (duplicateCustomer) {
        throw new ForbiddenException(
          `统一社会信用代码 ${updateCustomerDto.unifiedSocialCreditCode} 已存在，不能重复使用`,
        );
      }
    }

    // 如果更新了公司名称，检查是否与其他客户重复
    if (
      updateCustomerDto.companyName &&
      updateCustomerDto.companyName !== existingCustomer.companyName
    ) {
      const duplicateCustomerByName = await this.customerRepository.findOne({
        where: {
          companyName: updateCustomerDto.companyName,
          id: Not(id), // 排除当前客户自身
        },
      });

      if (duplicateCustomerByName) {
        throw new ForbiddenException(
          `公司名称 ${updateCustomerDto.companyName} 已存在，不能重复使用`,
        );
      }
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('用户不存在');
    }

    // 检查关键字段是否有变化，以决定是否需要创建服务历程记录
    const needCreateServiceHistory =
      (updateCustomerDto.consultantAccountant !== undefined &&
        updateCustomerDto.consultantAccountant !==
          existingCustomer.consultantAccountant) ||
      (updateCustomerDto.bookkeepingAccountant !== undefined &&
        updateCustomerDto.bookkeepingAccountant !==
          existingCustomer.bookkeepingAccountant) ||
      (updateCustomerDto.invoiceOfficer !== undefined &&
        updateCustomerDto.invoiceOfficer !== existingCustomer.invoiceOfficer) ||
      (updateCustomerDto.enterpriseStatus !== undefined &&
        updateCustomerDto.enterpriseStatus !==
          existingCustomer.enterpriseStatus) ||
      (updateCustomerDto.businessStatus !== undefined &&
        updateCustomerDto.businessStatus !== existingCustomer.businessStatus);

    // 检查客户等级是否有变化
    const customerLevelChanged = 
      updateCustomerDto.customerLevel !== undefined &&
      updateCustomerDto.customerLevel !== existingCustomer.customerLevel;

    // 处理跟进记录的追加逻辑
    let finalUpdateDto = { ...updateCustomerDto };
    
    if (updateCustomerDto.followUpRecords && updateCustomerDto.followUpRecords.length > 0) {
      // 获取现有的跟进记录
      const existingFollowUpRecords = existingCustomer.followUpRecords || [];
      
      // 处理新的跟进记录：为有text但没有datetime的记录自动填充当前时间
      const processedFollowUpRecords = updateCustomerDto.followUpRecords.map(record => {
        if (record.text && !record.datetime) {
          return {
            ...record,
            datetime: new Date().toISOString()
          };
        }
        return record;
      });
      
      // 将处理后的跟进记录追加到现有记录中
      finalUpdateDto.followUpRecords = [
        ...existingFollowUpRecords,
        ...processedFollowUpRecords
      ];
      
      this.logger.log(
        `为客户 ${existingCustomer.companyName} 追加 ${updateCustomerDto.followUpRecords.length} 条跟进记录`
      );
    }

    // 更新客户信息
    await this.customerRepository.update(id, finalUpdateDto);

    // 获取更新后的客户信息
    const updatedCustomer = await this.findOne(id, userId);

    // 如果关键字段有变化，创建服务历程记录
    if (needCreateServiceHistory) {
      try {
        await this.serviceHistoryService.createFromCustomer(updatedCustomer);
        this.logger.log(
          `已为客户 ${updatedCustomer.companyName} 创建服务历程记录`,
        );
      } catch (error) {
        this.logger.error(
          `创建服务历程记录失败: ${error.message}`,
          error.stack,
        );
        // 不阻止更新主流程，即使服务历程创建失败
      }
    }

    // 如果客户等级有变化，创建等级历史记录
    if (customerLevelChanged) {
      try {
        this.logger.log(
          `客户 ${updatedCustomer.companyName} 的等级从 ${existingCustomer.customerLevel} 变更为 ${updatedCustomer.customerLevel}`,
        );
        
        // 创建等级历史记录
        await this.customerLevelHistoryService.autoCreateLevelHistory(
          updatedCustomer.id,
          updatedCustomer.companyName,
          updatedCustomer.unifiedSocialCreditCode,
          existingCustomer.customerLevel,
          updatedCustomer.customerLevel,
          user.username, // 操作人员
          '客户信息更新'  // 变更原因
        );
        
        this.logger.log(
          `已为客户 ${updatedCustomer.companyName} 创建等级历史记录`,
        );
      } catch (error) {
        this.logger.error(
          `创建客户等级历史记录失败: ${error.message}`,
          error.stack,
        );
        // 不阻止更新主流程
      }
    }

    // 检查客户状态是否有变化
    const enterpriseStatusChanged = 
      updateCustomerDto.enterpriseStatus !== undefined &&
      updateCustomerDto.enterpriseStatus !== existingCustomer.enterpriseStatus;
    
    const businessStatusChanged = 
      updateCustomerDto.businessStatus !== undefined &&
      updateCustomerDto.businessStatus !== existingCustomer.businessStatus;

    // 如果客户状态有变化，创建状态历史记录
    if (enterpriseStatusChanged || businessStatusChanged) {
      try {
        this.logger.log(
          `客户 ${updatedCustomer.companyName} 的状态发生变化: 企业状态 ${existingCustomer.enterpriseStatus} -> ${updatedCustomer.enterpriseStatus}, 业务状态 ${existingCustomer.businessStatus} -> ${updatedCustomer.businessStatus}`,
        );
        
        // 动态导入避免循环依赖
        const { CustomerStatusHistory } = await import('../reports/customer-status-history/entities/customer-status-history.entity');
        
        // 直接使用数据源创建记录
        const statusHistoryRepository = this.customerRepository.manager.getRepository(CustomerStatusHistory);
        
        await statusHistoryRepository.save({
          customerId: existingCustomer.id,
          companyName: existingCustomer.companyName,
          unifiedSocialCreditCode: existingCustomer.unifiedSocialCreditCode,
          previousEnterpriseStatus: existingCustomer.enterpriseStatus,
          currentEnterpriseStatus: updatedCustomer.enterpriseStatus,
          previousBusinessStatus: existingCustomer.businessStatus,
          currentBusinessStatus: updatedCustomer.businessStatus,
          changeDate: new Date(),
          changeReason: '客户状态更新',
          changedBy: user.username,
        });

        this.logger.log(
          `已为客户 ${updatedCustomer.companyName} 创建状态历史记录`,
        );
      } catch (error) {
        this.logger.error(
          `创建状态历史记录失败: ${error.message}`,
          error.stack,
        );
        // 不阻止更新主流程，即使状态历史创建失败
      }
    }

    // 返回更新后的客户信息
    return updatedCustomer;
  }

  // 删除客户
  async remove(id: number, userId: number) {
    // 检查权限 - 删除操作只需要删除权限
    const hasPermission =
      await this.customerPermissionService.hasCustomerDeletePermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有删除客户的权限');
    }

    // 查找客户，检查是否存在
    const customer = await this.findOne(id, userId);

    // 删除客户
    return await this.customerRepository.remove(customer);
  }

  /**
   * 导出客户数据为CSV
   */
  async exportToCsv(query: any, userId: number): Promise<string> {
    try {
      // 首先获取查询权限
      const permissionConditions =
        await this.customerPermissionService.buildCustomerQueryFilter(userId);

      console.log('导出CSV - 权限条件:', JSON.stringify(permissionConditions));

      // 如果权限条件是 {id: -1}，说明用户没有任何查看权限
      if (
        !Array.isArray(permissionConditions) &&
        permissionConditions.id === -1
      ) {
        throw new ForbiddenException('您没有权限导出客户数据');
      }

      // 检查用户是否是管理员或超级管理员
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username', 'roles'],
      });

      const isAdmin =
        user &&
        user.roles &&
        (user.roles.includes('admin') || user.roles.includes('super_admin'));

      // 创建查询构建器
      const queryBuilder =
        this.customerRepository.createQueryBuilder('customer');

      // 如果不是管理员，添加状态过滤条件
      if (!isAdmin) {
        queryBuilder.andWhere(
          '(customer.businessStatus != :lostStatus OR customer.businessStatus IS NULL)',
          { lostStatus: 'lost' },
        );
        queryBuilder.andWhere(
          '(customer.enterpriseStatus != :cancelledStatus OR customer.enterpriseStatus IS NULL)',
          { cancelledStatus: 'cancelled' },
        );
      }

      // 添加过滤条件，参考findAll方法的查询条件部分
      if (query.keyword !== undefined) {
        if (query.keyword === '') {
          queryBuilder.andWhere(
            "(customer.companyName IS NULL OR customer.companyName = '')",
          );
        } else {
          queryBuilder.andWhere(
            '(customer.companyName LIKE :keyword OR customer.unifiedSocialCreditCode LIKE :keyword)',
            {
              keyword: `%${query.keyword}%`,
            },
          );
        }
      }

      if (query.unifiedSocialCreditCode !== undefined) {
        if (query.unifiedSocialCreditCode === '') {
          queryBuilder.andWhere(
            "(customer.unifiedSocialCreditCode IS NULL OR customer.unifiedSocialCreditCode = '')",
          );
        } else {
          queryBuilder.andWhere(
            'customer.unifiedSocialCreditCode LIKE :unifiedSocialCreditCode',
            {
              unifiedSocialCreditCode: `%${query.unifiedSocialCreditCode}%`,
            },
          );
        }
      }

      if (query.consultantAccountant !== undefined) {
        if (query.consultantAccountant === '') {
          queryBuilder.andWhere(
            "(customer.consultantAccountant IS NULL OR customer.consultantAccountant = '')",
          );
        } else {
          queryBuilder.andWhere(
            'customer.consultantAccountant = :consultantAccountant',
            {
              consultantAccountant: query.consultantAccountant,
            },
          );
        }
      }

      if (query.bookkeepingAccountant !== undefined) {
        if (query.bookkeepingAccountant === '') {
          queryBuilder.andWhere(
            "(customer.bookkeepingAccountant IS NULL OR customer.bookkeepingAccountant = '')",
          );
        } else {
          queryBuilder.andWhere(
            'customer.bookkeepingAccountant = :bookkeepingAccountant',
            {
              bookkeepingAccountant: query.bookkeepingAccountant,
            },
          );
        }
      }

      if (query.taxBureau !== undefined) {
        if (query.taxBureau === '') {
          queryBuilder.andWhere(
            "(customer.taxBureau IS NULL OR customer.taxBureau = '')",
          );
        } else {
          queryBuilder.andWhere('customer.taxBureau LIKE :taxBureau', {
            taxBureau: `%${query.taxBureau}%`,
          });
        }
      }

      if (query.enterpriseType !== undefined) {
        if (query.enterpriseType === '') {
          // 如果参数值为空字符串，则查询字段为 NULL 的记录
          queryBuilder.andWhere(
            "(customer.enterpriseType IS NULL OR customer.enterpriseType = '')",
          );
        } else {
          // 处理多选企业类型筛选
          const enterpriseTypes = Array.isArray(query.enterpriseType) 
            ? query.enterpriseType 
            : [query.enterpriseType];
          
          if (enterpriseTypes.length > 0) {
            const conditions = [];
            const params = {};
            let paramIndex = 0;
            
            // 检查是否包含空值或null值
            const hasEmptyValue = enterpriseTypes.some(type => 
              type === '' || type === null || type === undefined || type === 'null'
            );
            
            // 如果包含空值，添加NULL或空字符串的条件
            if (hasEmptyValue) {
              conditions.push("(customer.enterpriseType IS NULL OR customer.enterpriseType = '')");
            }
            
            // 处理非空值
            enterpriseTypes.forEach((type) => {
              if (type !== '' && type !== null && type !== undefined && type !== 'null') {
                conditions.push(`customer.enterpriseType LIKE :enterpriseTypeExport${paramIndex}`);
                params[`enterpriseTypeExport${paramIndex}`] = `%${type}%`;
                paramIndex++;
              }
            });
            
            if (conditions.length > 0) {
              queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
            }
          }
        }
      }

      if (query.industryCategory !== undefined) {
        if (query.industryCategory === '') {
          queryBuilder.andWhere(
            "(customer.industryCategory IS NULL OR customer.industryCategory = '')",
          );
        } else {
          queryBuilder.andWhere(
            'customer.industryCategory LIKE :industryCategory',
            {
              industryCategory: `%${query.industryCategory}%`,
            },
          );
        }
      }

      if (query.enterpriseStatus !== undefined) {
        if (query.enterpriseStatus === '') {
          queryBuilder.andWhere(
            "(customer.enterpriseStatus IS NULL OR customer.enterpriseStatus = '')",
          );
        } else {
          // 处理多选企业状态筛选
          const enterpriseStatuses = Array.isArray(query.enterpriseStatus) 
            ? query.enterpriseStatus 
            : [query.enterpriseStatus];
          
          if (enterpriseStatuses.length > 0) {
            const conditions = [];
            const params = {};
            let paramIndex = 0;
            
            // 检查是否包含空值或null值
            const hasEmptyValue = enterpriseStatuses.some(status => 
              status === '' || status === null || status === undefined || status === 'null'
            );
            
            // 如果包含空值，添加NULL或空字符串的条件
            if (hasEmptyValue) {
              conditions.push("(customer.enterpriseStatus IS NULL OR customer.enterpriseStatus = '')");
            }
            
            // 处理非空值
            enterpriseStatuses.forEach((status) => {
              if (status !== '' && status !== null && status !== undefined && status !== 'null') {
                conditions.push(`customer.enterpriseStatus = :enterpriseStatusExport${paramIndex}`);
                params[`enterpriseStatusExport${paramIndex}`] = status;
                paramIndex++;
              }
            });
            
            if (conditions.length > 0) {
              queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
            }
          }
        }
      }

      if (query.customerLevel !== undefined) {
        if (query.customerLevel === '') {
          queryBuilder.andWhere(
            "(customer.customerLevel IS NULL OR customer.customerLevel = '')",
          );
        } else {
          // 处理多选客户等级筛选
          const customerLevels = Array.isArray(query.customerLevel) 
            ? query.customerLevel 
            : [query.customerLevel];
          
          if (customerLevels.length > 0) {
            const conditions = [];
            const params = {};
            let paramIndex = 0;
            
            // 检查是否包含空值或null值
            const hasEmptyValue = customerLevels.some(level => 
              level === '' || level === null || level === undefined || level === 'null'
            );
            
            // 如果包含空值，添加NULL或空字符串的条件
            if (hasEmptyValue) {
              conditions.push("(customer.customerLevel IS NULL OR customer.customerLevel = '')");
            }
            
            // 处理非空值
            customerLevels.forEach((level) => {
              if (level !== '' && level !== null && level !== undefined && level !== 'null') {
                conditions.push(`customer.customerLevel = :customerLevelExport${paramIndex}`);
                params[`customerLevelExport${paramIndex}`] = level;
                paramIndex++;
              }
            });
            
            if (conditions.length > 0) {
              queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
            }
          }
        }
      }

      if (query.location !== undefined) {
        if (query.location === '') {
          queryBuilder.andWhere(
            "(customer.location IS NULL OR customer.location = '')",
          );
        } else {
          // 处理多选归属地筛选
          const locations = Array.isArray(query.location) 
            ? query.location 
            : [query.location];
          
          if (locations.length > 0) {
            const conditions = [];
            const params = {};
            let paramIndex = 0;
            
            // 检查是否包含空值或null值
            const hasEmptyValue = locations.some(loc => 
              loc === '' || loc === null || loc === undefined || loc === 'null'
            );
            
            // 如果包含空值，添加NULL或空字符串的条件
            if (hasEmptyValue) {
              conditions.push("(customer.location IS NULL OR customer.location = '')");
            }
            
            // 处理非空值
            locations.forEach((loc) => {
              if (loc !== '' && loc !== null && loc !== undefined && loc !== 'null') {
                conditions.push(`customer.location LIKE :locationExport${paramIndex}`);
                params[`locationExport${paramIndex}`] = `%${loc}%`;
                paramIndex++;
              }
            });
            
            if (conditions.length > 0) {
              queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
            }
          }
        }
      }

      if (query.businessStatus !== undefined) {
        if (query.businessStatus === '') {
          queryBuilder.andWhere(
            "(customer.businessStatus IS NULL OR customer.businessStatus = '')",
          );
        } else {
          // 处理多选业务状态筛选
          const businessStatuses = Array.isArray(query.businessStatus) 
            ? query.businessStatus 
            : [query.businessStatus];
          
          if (businessStatuses.length > 0) {
            const conditions = [];
            const params = {};
            let paramIndex = 0;
            
            // 检查是否包含空值或null值
            const hasEmptyValue = businessStatuses.some(status => 
              status === '' || status === null || status === undefined || status === 'null'
            );
            
            // 如果包含空值，添加NULL或空字符串的条件
            if (hasEmptyValue) {
              conditions.push("(customer.businessStatus IS NULL OR customer.businessStatus = '')");
            }
            
            // 处理非空值
            businessStatuses.forEach((status) => {
              if (status !== '' && status !== null && status !== undefined && status !== 'null') {
                conditions.push(`customer.businessStatus = :businessStatusExport${paramIndex}`);
                params[`businessStatusExport${paramIndex}`] = status;
                paramIndex++;
              }
            });
            
            if (conditions.length > 0) {
              queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
            }
          }
        }
      }

      if (query.clanId !== undefined) {
        if (query.clanId === null || query.clanId === 0) {
          queryBuilder.andWhere('customer.clanId IS NULL');
        } else {
          queryBuilder.andWhere('customer.clanId = :clanId', {
            clanId: query.clanId,
          });
        }
      }

      if (query.startDate && query.endDate) {
        // 创建日期对象
        const start = new Date(query.startDate);
        // 对于结束日期，设置为当天的23:59:59.999，以包含整天
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);

        queryBuilder.andWhere(
          'customer.createTime BETWEEN :startDate AND :endDate',
          {
            startDate: start,
            endDate: end,
          },
        );

        console.log(
          `客户导出日期范围: ${start.toISOString()} - ${end.toISOString()}`,
        );
      }

      // 处理权限条件
      if (Array.isArray(permissionConditions)) {
        // 如果是数组，说明有多个 OR 条件
        // 检查是否包含空对象（表示无限制条件）
        if (
          !permissionConditions.some(
            (condition) => Object.keys(condition).length === 0,
          )
        ) {
          // 如果没有空对象，添加权限条件
          const allParams = {};
          const orConditions = permissionConditions.map((condition, index) => {
            const conditions = [];

            Object.entries(condition).forEach(([key, value]) => {
              const paramKey = `perm_${key}_${index}`;
              allParams[paramKey] = value;
              conditions.push(`customer.${key} = :${paramKey}`);
            });

            return conditions.join(' AND ');
          });

          if (orConditions.length > 0) {
            queryBuilder.andWhere(`(${orConditions.join(' OR ')})`);
            queryBuilder.setParameters(allParams);
            console.log('设置的参数:', allParams);
          }
        }
      } else if (Object.keys(permissionConditions).length > 0) {
        // 如果不是数组且不是空对象，添加权限条件
        Object.entries(permissionConditions).forEach(([key, value]) => {
          queryBuilder.andWhere(`customer.${key} = :${key}`, { [key]: value });
        });
      }

      // 跟进记录搜索
      if (query.followUpKeyword !== undefined && query.followUpKeyword !== '') {
        queryBuilder.andWhere(
          "JSON_SEARCH(customer.followUpRecords, 'all', :followUpKeyword) IS NOT NULL",
          { followUpKeyword: `%${query.followUpKeyword}%` }
        );
      }

      console.log('导出CSV - 最终SQL:', queryBuilder.getSql());
      console.log('导出CSV - 最终参数:', queryBuilder.getParameters());

      // 查询数据
      const customers = await queryBuilder.getMany();
      console.log(`导出CSV - 查询到${customers.length}条记录`);

      // 定义要导出的字段映射
      const fieldMapping = {
        companyName: '企业名称',
        location: '归属地',
        consultantAccountant: '顾问会计',
        bookkeepingAccountant: '记账会计',
        invoiceOfficer: '开票员',
        enterpriseType: '企业类型',
        unifiedSocialCreditCode: '统一社会信用代码',
        taxBureau: '所属分局',
        clanId: '宗族ID',
        enterpriseStatus: '企业状态',
        customerLevel: '客户分级',
        sealStorageNumber: '章存放编号',
        paperArchiveNumber: '纸质资料档案编号',
      };

      // 处理导出数据，确保JSON字段正确转换
      const exportData = customers.map((customer) => {
        const item: any = {};

        // 只导出需要的字段
        Object.keys(fieldMapping).forEach((field) => {
          item[field] = customer[field] || '';
        });

        return item;
      });

      // 使用json2csv库来生成CSV
      try {
        const Parser = require('json2csv').Parser;
        const fields = Object.keys(fieldMapping).map((field) => ({
          label: fieldMapping[field],
          value: field,
        }));

        const parser = new Parser({ fields });
        // 添加UTF-8 BOM标记确保Excel正确识别中文
        return '\uFEFF' + parser.parse(exportData);
      } catch (err) {
        console.error('导出CSV转换失败:', err);
        throw new BadRequestException(`导出CSV失败: ${err.message}`);
      }
    } catch (error) {
      this.logger.error(`导出CSV失败: ${error.message}`, error.stack);
      throw new BadRequestException(`导出CSV失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`成功删除文件: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`删除文件失败: ${error.message}`, error.stack);
      // 不抛出异常，因为这只是清理操作
    }
  }

  // 导入Excel客户数据
  async importCustomers(
    file: Express.Multer.File,
    userId: number,
  ): Promise<{
    success: boolean;
    message: string;
    count?: number;
    failedRecords?: Array<{
      row: number;
      companyName: string;
      unifiedSocialCreditCode: string;
      reason: string;
    }>;
  }> {
    try {
      this.logger.log(`开始执行导入操作，用户ID: ${userId}`);

      // 使用批量操作权限检查方法，避免触发ID查询
      const hasPermission =
        (await this.customerPermissionService.checkBatchOperationPermission(
          userId,
          'customer_action_import',
        )) ||
        (await this.customerPermissionService.checkBatchOperationPermission(
          userId,
          'customer_action_create',
        ));

      this.logger.log(`权限检查结果: ${hasPermission}`);

      if (!hasPermission) {
        throw new ForbiddenException('没有导入客户数据的权限');
      }

      // 创建临时目录路径
      const tempDir = path.join(os.tmpdir(), 'zhongyue-import');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 保存上传的文件到临时目录
      const timestamp = Date.now();
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `import-${timestamp}${fileExt}`;
      const filePath = path.join(tempDir, fileName);

      this.logger.log(`保存导入文件到: ${filePath}`);
      fs.writeFileSync(filePath, file.buffer);

      // 尝试安装Python所需依赖（如果必要）
      try {
        // 使用完整路径
        const pythonPath = '/usr/bin/python3';
        const pipPath = '/usr/bin/pip3';

        // 尝试安装必要的Python依赖
        this.logger.log('检查Python环境...');
        try {
          // 检查Python版本
          const { stdout: pythonVersion } = await execPromise(
            `${pythonPath} --version`,
          );
          this.logger.log(`找到Python版本: ${pythonVersion.trim()}`);

          // 列出已安装的包
          this.logger.log('列出已安装的Python包...');
          const { stdout: installedPackages } = await execPromise(
            `${pipPath} list`,
          );
          this.logger.debug(`已安装的包: ${installedPackages}`);

          // 检查是否需要安装缺少的包
          const requiredPackages = [
            'pandas',
            'sqlalchemy',
            'pymysql',
            'openpyxl',
          ];
          const missingPackages = [];

          for (const pkg of requiredPackages) {
            if (!installedPackages.includes(pkg)) {
              missingPackages.push(pkg);
            }
          }

          if (missingPackages.length > 0) {
            // 尝试安装依赖包
            this.logger.log(
              `尝试安装缺少的Python依赖: ${missingPackages.join(', ')}...`,
            );
            await execPromise(
              `${pipPath} install ${missingPackages.join(' ')} --no-cache-dir`,
            );
            this.logger.log('Python依赖安装成功');
          } else {
            this.logger.log('所有必要的Python依赖已安装');
          }
        } catch (error) {
          this.logger.warn(
            `安装Python依赖失败: ${error.message}，将继续尝试执行脚本`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Python环境检查失败: ${error.message}，将继续尝试执行脚本`,
        );
      }

      // 调用Python脚本处理数据导入
      const scriptPath = path.join(
        process.cwd(),
        'src/modules/customer/utils/import_data.py',
      );

      // 执行Python脚本，传递文件路径参数和文件类型参数
      this.logger.log(`开始执行Python导入脚本，文件类型: ${fileExt}`);
      const { stdout, stderr } = await this.executeImportScript(
        scriptPath,
        filePath,
      );

      this.logger.log(`Python脚本执行完成`);
      this.logger.debug(`Python脚本输出: ${stdout}`);
      if (stderr) {
        this.logger.error(`Python脚本错误: ${stderr}`);
      }

      // 导入完成后删除临时文件
      try {
        fs.unlinkSync(filePath);
        this.logger.log('临时文件已删除');
      } catch (error) {
        this.logger.warn(`删除临时文件失败: ${error.message}`);
      }

      // 尝试从标准输出中解析JSON结果
      let importResult: any = null;
      try {
        // 查找并解析导入结果JSON
        const importResultMatch = stdout.match(/IMPORT_RESULT_JSON: (\{.*\})/);
        if (importResultMatch && importResultMatch[1]) {
          importResult = JSON.parse(importResultMatch[1]);
          this.logger.log(`成功解析导入结果: ${JSON.stringify(importResult)}`);
        }
      } catch (error) {
        this.logger.error(`解析导入结果JSON失败: ${error.message}`);
      }

      // 如果找到了解析结果，使用它
      if (importResult) {
        const {
          success,
          imported_count,
          failed_count,
          failed_records,
          error_message,
        } = importResult;

        // 记录导入结果
        this.logger.log(
          `导入结果: 成功=${success}, 导入=${imported_count}, 失败=${failed_count}`,
        );

        // 检查是否所有失败记录都是因为重复
        const allDuplicates =
          failed_records &&
          failed_records.length > 0 &&
          failed_records.every(
            (record) => record.reason === '统一社会信用代码重复',
          );

        // 构造返回消息
        let message = '';
        let resultSuccess = success;

        if (success) {
          message = `成功导入${imported_count}条客户记录`;
          if (failed_count > 0) {
            message += `，${failed_count}条记录导入失败`;
          }
        } else if (allDuplicates) {
          // 如果所有失败都是因为重复，视为成功但无新增记录
          message = `所有记录(${failed_count}条)均为重复数据，无需导入`;
          resultSuccess = true; // 虽然Python返回false，但我们视为业务上的"成功"
        } else {
          message = error_message || '导入失败，未能导入任何记录';
          if (failed_count > 0) {
            message += `，${failed_count}条记录有错误`;
          }
        }

        // 返回结果
        return {
          success: resultSuccess,
          message,
          count: imported_count > 0 ? imported_count : undefined,
          failedRecords:
            failed_records && failed_records.length > 0
              ? failed_records
              : undefined,
        };
      }

      // 尝试从错误信息中解析JSON
      try {
        // 查找并解析错误信息JSON
        const errorInfoMatch = stdout.match(/ERROR_INFO_JSON: (\{.*\})/);
        if (errorInfoMatch && errorInfoMatch[1]) {
          const errorInfo = JSON.parse(errorInfoMatch[1]);
          this.logger.log(`解析到错误信息: ${JSON.stringify(errorInfo)}`);

          return {
            success: false,
            message: errorInfo.error_message || '导入失败',
            failedRecords: errorInfo.failed_records,
          };
        }
      } catch (error) {
        this.logger.error(`解析错误信息JSON失败: ${error.message}`);
      }

      // 如果没有找到JSON结果，尝试使用老方法解析
      // 获取导入记录数
      const importCount = stdout.match(/成功导入 (\d+) 条记录/);
      const count = importCount ? parseInt(importCount[1], 10) : 0;

      // 检查是否有重复数据的提示
      const duplicateMatch = stdout.match(/所有记录\((\d+)条\)均为重复数据/);
      if (duplicateMatch) {
        const duplicateCount = parseInt(duplicateMatch[1], 10);
        this.logger.log(`检测到${duplicateCount}条重复记录`);

        return {
          success: true, // 重复数据视为业务上的"成功"
          message: `所有记录(${duplicateCount}条)均为重复数据，无需导入`,
        };
      }

      this.logger.log(`导入完成，共导入${count}条记录`);

      // 简单返回结果
      return {
        success: count > 0,
        message:
          count > 0
            ? `成功导入${count}条客户记录`
            : '导入失败，未能导入任何记录',
        count: count > 0 ? count : undefined,
      };
    } catch (error) {
      this.logger.error(`导入客户数据失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: `导入客户数据失败: ${error.message}`,
      };
    }
  }

  /**
   * 执行Python导入脚本的工具方法
   * 此方法不进行任何权限检查，只负责执行脚本并返回结果
   */
  async executeImportScript(
    scriptPath: string,
    filePath: string,
  ): Promise<{ stdout: string; stderr: string }> {
    this.logger.log('开始执行Python导入脚本');
    try {
      // 使用相对命令，让系统在PATH中查找Python
      this.logger.log('尝试执行Python脚本');

      // 从配置服务获取数据库连接信息
      const dbConfig = {
        DB_HOST: this.configService.get('DB_HOST') || 'host.docker.internal',
        DB_PORT: this.configService.get('DB_PORT') || '3306',
        DB_DATABASE: this.configService.get('DB_DATABASE'),
        DB_USERNAME: this.configService.get('DB_USERNAME'),
        DB_PASSWORD: this.configService.get('DB_PASSWORD'),
      };

      this.logger.log(
        `数据库连接配置: Host=${dbConfig.DB_HOST}, Port=${dbConfig.DB_PORT}, Name=${dbConfig.DB_DATABASE}, User=${dbConfig.DB_USERNAME}`,
      );

      // 构建环境变量对象，供Python脚本使用
      const env = {
        ...process.env,
        ...dbConfig,
        PYTHONUNBUFFERED: '1', // 确保Python输出不被缓冲
      };

      // 验证脚本是否存在
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Python脚本文件不存在: ${scriptPath}`);
      }

      // 验证输入文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`导入文件不存在: ${filePath}`);
      }

      // 获取文件类型
      const fileExt = path.extname(filePath).toLowerCase();
      this.logger.log(`导入文件类型: ${fileExt}`);

      // 打印脚本路径与文件路径
      this.logger.log(`脚本路径: ${scriptPath}`);
      this.logger.log(`文件路径: ${filePath}`);
      this.logger.log(`环境变量DB_HOST: ${env.DB_HOST}`);
      this.logger.log(`环境变量DB_PORT: ${env.DB_PORT}`);
      this.logger.log(`环境变量DB_DATABASE: ${env.DB_DATABASE}`);
      this.logger.log(`环境变量DB_USERNAME: ${env.DB_USERNAME}`);
      this.logger.log(
        `环境变量DB_PASSWORD长度: ${env.DB_PASSWORD ? env.DB_PASSWORD.length : 0}`,
      );

      // 使用spawn代替exec，可以更好地处理输出
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        // 使用spawn执行Python脚本
        const pythonProcess = spawn(
          'python3',
          [scriptPath, '--file', filePath],
          {
            env,
            shell: true, // 在shell中执行，可能有助于解决一些路径问题
          },
        );

        let stdout = '';
        let stderr = '';

        // 收集标准输出
        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          this.logger.debug(`Python输出: ${output}`);
        });

        // 收集错误输出
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          this.logger.error(`Python错误: ${error}`);
        });

        // 处理完成事件
        pythonProcess.on('close', (code) => {
          this.logger.log(`Python进程退出，退出码: ${code}`);

          if (code === 0) {
            resolve({ stdout, stderr });
          } else {
            // 在stdout中寻找错误信息JSON
            let errorDetails = null;
            let errorInfoMatch = null;

            // 查找ERROR_INFO_JSON格式的错误信息
            const errorInfoRegex = /ERROR_INFO_JSON: (\{.*\})/s;
            errorInfoMatch = stdout.match(errorInfoRegex);
            if (errorInfoMatch && errorInfoMatch[1]) {
              try {
                errorDetails = JSON.parse(errorInfoMatch[1]);
                this.logger.error(
                  `Python错误详情: ${JSON.stringify(errorDetails)}`,
                );
              } catch (e) {
                this.logger.error(`解析ERROR_INFO_JSON失败: ${e.message}`);
              }
            }

            // 查找ERROR_DETAILS_JSON格式的错误信息
            if (!errorDetails) {
              const detailsRegex = /ERROR_DETAILS_JSON: (\{.*\})/s;
              const detailsMatch = stdout.match(detailsRegex);
              if (detailsMatch && detailsMatch[1]) {
                try {
                  errorDetails = JSON.parse(detailsMatch[1]);
                  this.logger.error(
                    `Python错误详情: ${JSON.stringify(errorDetails)}`,
                  );
                } catch (e) {
                  this.logger.error(`解析ERROR_DETAILS_JSON失败: ${e.message}`);
                }
              }
            }

            // 查找DATABASE_ERROR_JSON格式的错误信息
            if (!errorDetails) {
              const dbErrorRegex = /DATABASE_ERROR_JSON: (\{.*\})/s;
              const dbErrorMatch = stdout.match(dbErrorRegex);
              if (dbErrorMatch && dbErrorMatch[1]) {
                try {
                  errorDetails = JSON.parse(dbErrorMatch[1]);
                  this.logger.error(
                    `数据库错误详情: ${JSON.stringify(errorDetails)}`,
                  );
                } catch (e) {
                  this.logger.error(
                    `解析DATABASE_ERROR_JSON失败: ${e.message}`,
                  );
                }
              }
            }

            if (stderr) {
              this.logger.error(`Python脚本错误输出: ${stderr}`);
            }

            if (stdout) {
              // 记录完整输出供调试，但只输出前2000个字符避免日志过大
              const truncatedStdout =
                stdout.length > 2000
                  ? stdout.substring(0, 2000) + '...(截断)'
                  : stdout;
              this.logger.log(`Python脚本标准输出: ${truncatedStdout}`);
            }

            // 构建详细错误信息
            let errorMessage = `Python脚本执行失败，退出码: ${code}`;

            // 如果解析到了错误详情，添加到错误信息中
            if (errorDetails && errorDetails.error_message) {
              errorMessage += `\n错误类型: ${errorDetails.error_type || '未知'}`;
              errorMessage += `\n错误描述: ${errorDetails.error_message}`;

              // 如果有失败记录，添加概述
              if (
                errorDetails.failed_records &&
                errorDetails.failed_records.length > 0
              ) {
                errorMessage += `\n失败记录数: ${errorDetails.failed_records.length}`;
                // 添加前3条失败记录的详情
                const recordsToShow = Math.min(
                  3,
                  errorDetails.failed_records.length,
                );
                errorMessage += `\n失败记录示例:`;
                for (let i = 0; i < recordsToShow; i++) {
                  const record = errorDetails.failed_records[i];
                  errorMessage += `\n - 行${record.row}: ${record.companyName || '未知企业'} - ${record.reason || '未知原因'}`;
                }
              }
            } else if (stderr) {
              // 如果没有解析到结构化错误信息但有stderr，使用stderr
              errorMessage += `\n${stderr}`;
            }

            reject(new Error(errorMessage));
          }
        });

        // 处理错误事件
        pythonProcess.on('error', (err) => {
          this.logger.error(`启动Python进程失败: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(`执行Python脚本失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 执行Python更新脚本的工具方法
   * 此方法不进行任何权限检查，只负责执行脚本并返回结果
   */
  async executeUpdateScript(
    scriptPath: string,
    filePath: string,
  ): Promise<{ stdout: string; stderr: string }> {
    this.logger.log('开始执行Python批量更新脚本');
    try {
      // 使用相对命令，让系统在PATH中查找Python
      this.logger.log('尝试执行Python脚本');

      // 从配置服务获取数据库连接信息
      const dbConfig = {
        DB_HOST: this.configService.get('DB_HOST') || 'host.docker.internal',
        DB_PORT: this.configService.get('DB_PORT') || '3306',
        DB_DATABASE: this.configService.get('DB_DATABASE'),
        DB_USERNAME: this.configService.get('DB_USERNAME'),
        DB_PASSWORD: this.configService.get('DB_PASSWORD'),
      };

      this.logger.log(
        `数据库连接配置: Host=${dbConfig.DB_HOST}, Port=${dbConfig.DB_PORT}, Name=${dbConfig.DB_DATABASE}, User=${dbConfig.DB_USERNAME}`,
      );

      // 构建环境变量对象，供Python脚本使用
      const env = {
        ...process.env,
        ...dbConfig,
        PYTHONUNBUFFERED: '1', // 确保Python输出不被缓冲
      };

      // 验证脚本是否存在
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Python脚本文件不存在: ${scriptPath}`);
      }

      // 验证输入文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 打印脚本路径与文件路径
      this.logger.log(`脚本路径: ${scriptPath}`);
      this.logger.log(`文件路径: ${filePath}`);
      this.logger.log(`环境变量DB_HOST: ${env.DB_HOST}`);
      this.logger.log(`环境变量DB_PORT: ${env.DB_PORT}`);
      this.logger.log(`环境变量DB_DATABASE: ${env.DB_DATABASE}`);
      this.logger.log(`环境变量DB_USERNAME: ${env.DB_USERNAME}`);
      this.logger.log(
        `环境变量DB_PASSWORD长度: ${env.DB_PASSWORD ? env.DB_PASSWORD.length : 0}`,
      );

      // 使用spawn代替exec，可以更好地处理输出
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        // 使用spawn执行Python脚本
        const pythonProcess = spawn(
          'python3',
          [scriptPath, '--file', filePath],
          {
            env,
            shell: true, // 在shell中执行，可能有助于解决一些路径问题
          },
        );

        let stdout = '';
        let stderr = '';

        // 收集标准输出
        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          this.logger.debug(`Python输出: ${output}`);
        });

        // 收集错误输出
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          this.logger.error(`Python错误: ${error}`);
        });

        // 处理完成事件
        pythonProcess.on('close', (code) => {
          this.logger.log(`Python进程退出，退出码: ${code}`);

          if (code === 0) {
            resolve({ stdout, stderr });
          } else {
            // 在stdout中寻找错误信息JSON
            let errorDetails = null;
            let errorInfoMatch = null;

            // 查找ERROR_INFO_JSON格式的错误信息
            const errorInfoRegex = /ERROR_INFO_JSON: (\{.*\})/s;
            errorInfoMatch = stdout.match(errorInfoRegex);
            if (errorInfoMatch && errorInfoMatch[1]) {
              try {
                errorDetails = JSON.parse(errorInfoMatch[1]);
                this.logger.error(
                  `Python错误详情: ${JSON.stringify(errorDetails)}`,
                );
              } catch (e) {
                this.logger.error(`解析ERROR_INFO_JSON失败: ${e.message}`);
              }
            }

            // 查找ERROR_DETAILS_JSON格式的错误信息
            if (!errorDetails) {
              const detailsRegex = /ERROR_DETAILS_JSON: (\{.*\})/s;
              const detailsMatch = stdout.match(detailsRegex);
              if (detailsMatch && detailsMatch[1]) {
                try {
                  errorDetails = JSON.parse(detailsMatch[1]);
                  this.logger.error(
                    `Python错误详情: ${JSON.stringify(errorDetails)}`,
                  );
                } catch (e) {
                  this.logger.error(`解析ERROR_DETAILS_JSON失败: ${e.message}`);
                }
              }
            }

            // 查找DATABASE_ERROR_JSON格式的错误信息
            if (!errorDetails) {
              const dbErrorRegex = /DATABASE_ERROR_JSON: (\{.*\})/s;
              const dbErrorMatch = stdout.match(dbErrorRegex);
              if (dbErrorMatch && dbErrorMatch[1]) {
                try {
                  errorDetails = JSON.parse(dbErrorMatch[1]);
                  this.logger.error(
                    `数据库错误详情: ${JSON.stringify(errorDetails)}`,
                  );
                } catch (e) {
                  this.logger.error(
                    `解析DATABASE_ERROR_JSON失败: ${e.message}`,
                  );
                }
              }
            }

            if (stderr) {
              this.logger.error(`Python脚本错误输出: ${stderr}`);
            }

            if (stdout) {
              // 记录完整输出供调试，但只输出前2000个字符避免日志过大
              const truncatedStdout =
                stdout.length > 2000
                  ? stdout.substring(0, 2000) + '...(截断)'
                  : stdout;
              this.logger.log(`Python脚本标准输出: ${truncatedStdout}`);
            }

            // 构建详细错误信息
            let errorMessage = `Python脚本执行失败，退出码: ${code}`;

            // 如果解析到了错误详情，添加到错误信息中
            if (errorDetails && errorDetails.error_message) {
              errorMessage += `\n错误类型: ${errorDetails.error_type || '未知'}`;
              errorMessage += `\n错误描述: ${errorDetails.error_message}`;

              // 如果有失败记录，添加概述
              if (
                errorDetails.failed_records &&
                errorDetails.failed_records.length > 0
              ) {
                errorMessage += `\n失败记录数: ${errorDetails.failed_records.length}`;
                // 添加前3条失败记录的详情
                const recordsToShow = Math.min(
                  3,
                  errorDetails.failed_records.length,
                );
                errorMessage += `\n失败记录示例:`;
                for (let i = 0; i < recordsToShow; i++) {
                  const record = errorDetails.failed_records[i];
                  errorMessage += `\n - 行${record.row}: ${record.companyName || '未知企业'} - ${record.reason || '未知原因'}`;
                }
              }
            } else if (stderr) {
              // 如果没有解析到结构化错误信息但有stderr，使用stderr
              errorMessage += `\n${stderr}`;
            }

            reject(new Error(errorMessage));
          }
        });

        // 处理错误事件
        pythonProcess.on('error', (err) => {
          this.logger.error(`启动Python进程失败: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(`执行Python脚本失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 批量更新客户数据
  async updateCustomers(
    file: Express.Multer.File,
    userId: number,
  ): Promise<{
    success: boolean;
    message: string;
    count?: number;
    failedRecords?: Array<{
      row: number;
      companyName: string;
      unifiedSocialCreditCode: string;
      reason: string;
    }>;
  }> {
    try {
      this.logger.log(`开始执行批量更新操作，用户ID: ${userId}`);

      // 使用批量操作权限检查方法，避免触发ID查询
      const hasPermission =
        await this.customerPermissionService.checkBatchOperationPermission(
          userId,
          'customer_action_update',
        );

      this.logger.log(`权限检查结果: ${hasPermission}`);

      if (!hasPermission) {
        throw new ForbiddenException('没有批量更新客户数据的权限');
      }

      // 创建临时目录路径
      const tempDir = path.join(os.tmpdir(), 'zhongyue-update');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 保存上传的文件到临时目录
      const timestamp = Date.now();
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `update-${timestamp}${fileExt}`;
      const filePath = path.join(tempDir, fileName);

      this.logger.log(`保存更新文件到: ${filePath}`);
      fs.writeFileSync(filePath, file.buffer);

      // 调用Python脚本处理数据更新
      const scriptPath = path.join(
        process.cwd(),
        'src/modules/customer/utils/update_data.py',
      );

      // 执行Python脚本，传递文件路径参数
      this.logger.log(`开始执行Python更新脚本，文件类型: ${fileExt}`);
      const { stdout, stderr } = await this.executeUpdateScript(
        scriptPath,
        filePath,
      );

      this.logger.log(`Python脚本执行完成`);
      this.logger.debug(`Python脚本输出: ${stdout}`);
      if (stderr) {
        this.logger.error(`Python脚本错误: ${stderr}`);
      }

      // 更新完成后删除临时文件
      try {
        fs.unlinkSync(filePath);
        this.logger.log('临时文件已删除');
      } catch (error) {
        this.logger.warn(`删除临时文件失败: ${error.message}`);
      }

      // 尝试从标准输出中解析JSON结果
      let updateResult: any = null;
      try {
        // 查找并解析更新结果JSON
        const updateResultMatch = stdout.match(/UPDATE_RESULT_JSON: (\{.*\})/);
        if (updateResultMatch && updateResultMatch[1]) {
          updateResult = JSON.parse(updateResultMatch[1]);
          this.logger.log(`成功解析更新结果: ${JSON.stringify(updateResult)}`);
        }
      } catch (error) {
        this.logger.error(`解析更新结果JSON失败: ${error.message}`);
      }

      // 如果找到了解析结果，使用它
      if (updateResult) {
        const {
          success,
          updated_count,
          failed_count,
          failed_records,
          error_message,
        } = updateResult;

        // 记录更新结果
        this.logger.log(
          `更新结果: 成功=${success}, 更新=${updated_count}, 失败=${failed_count}`,
        );

        // 检查是否所有失败记录都是因为重复
        const allDuplicates =
          failed_records &&
          failed_records.length > 0 &&
          failed_records.every(
            (record) => record.reason === '统一社会信用代码重复',
          );

        // 构造返回消息
        let message = '';
        let resultSuccess = success;

        if (success) {
          message = `成功更新${updated_count}条客户记录`;
          if (failed_count > 0) {
            message += `，${failed_count}条记录更新失败`;
          }
        } else if (allDuplicates) {
          // 如果所有失败都是因为重复，视为成功但无新增记录
          message = `所有记录(${failed_count}条)均为重复数据，无需更新`;
          resultSuccess = true; // 虽然Python返回false，但我们视为业务上的"成功"
        } else {
          message = error_message || '更新失败，未能更新任何记录';
          if (failed_count > 0) {
            message += `，${failed_count}条记录有错误`;
          }
        }

        // 返回结果
        return {
          success: resultSuccess,
          message,
          count: updated_count > 0 ? updated_count : undefined,
          failedRecords:
            failed_records && failed_records.length > 0
              ? failed_records
              : undefined,
        };
      }

      // 尝试从错误信息中解析JSON
      try {
        // 查找并解析错误信息JSON
        const errorInfoMatch = stdout.match(/ERROR_INFO_JSON: (\{.*\})/);
        if (errorInfoMatch && errorInfoMatch[1]) {
          const errorInfo = JSON.parse(errorInfoMatch[1]);
          this.logger.log(`解析到错误信息: ${JSON.stringify(errorInfo)}`);

          return {
            success: false,
            message: errorInfo.error_message || '更新失败',
            failedRecords: errorInfo.failed_records,
          };
        }
      } catch (error) {
        this.logger.error(`解析错误信息JSON失败: ${error.message}`);
      }

      // 如果没有找到JSON结果，尝试使用老方法解析
      // 获取更新记录数
      const updateCount = stdout.match(/成功更新 (\d+) 条记录/);
      const count = updateCount ? parseInt(updateCount[1], 10) : 0;

      // 检查是否有重复数据的提示
      const duplicateMatch = stdout.match(/所有记录\((\d+)条\)均为重复数据/);
      if (duplicateMatch) {
        const duplicateCount = parseInt(duplicateMatch[1], 10);
        this.logger.log(`检测到${duplicateCount}条重复记录`);

        return {
          success: true, // 重复数据视为业务上的"成功"
          message: `所有记录(${duplicateCount}条)均为重复数据，无需更新`,
        };
      }

      this.logger.log(`更新完成，共更新${count}条记录`);

      // 简单返回结果
      return {
        success: count > 0,
        message:
          count > 0
            ? `成功更新${count}条客户记录`
            : '更新失败，未能更新任何记录',
        count: count > 0 ? count : undefined,
      };
    } catch (error) {
      this.logger.error(`批量更新客户数据失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: `批量更新客户数据失败: ${error.message}`,
      };
    }
  }

  /**
   * 根据企业名称或统一社会信用代码查询客户档案信息（公开接口）
   * @param searchDto 查询条件，必须提供企业名称或统一社会信用代码中的至少一个参数
   * @returns 客户档案信息列表
   */
  async searchCustomerArchive(searchDto: SearchCustomerArchiveDto) {
    const { companyName, unifiedSocialCreditCode } = searchDto;

    // 验证是否提供了至少一个查询参数
    if (
      (!companyName || companyName.trim() === '') &&
      (!unifiedSocialCreditCode || unifiedSocialCreditCode.trim() === '')
    ) {
      throw new BadRequestException('请输入企业名称或统一社会信用代码');
    }

    // 创建查询构建器，只选择需要的字段
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.companyName',
        'customer.unifiedSocialCreditCode',
        'customer.sealStorageNumber',
        'customer.onlineBankingStorageNumber',
        'customer.paperArchiveNumber',
        'customer.archiveStorageRemarks',
      ]);

    // 构建查询条件：企业名称或统一社会信用代码
    const whereConditions = [];
    const parameters: any = {};

    if (companyName && companyName.trim() !== '') {
      whereConditions.push('customer.companyName LIKE :companyName');
      parameters.companyName = `%${companyName.trim()}%`;
    }

    if (unifiedSocialCreditCode && unifiedSocialCreditCode.trim() !== '') {
      whereConditions.push(
        'customer.unifiedSocialCreditCode LIKE :unifiedSocialCreditCode',
      );
      parameters.unifiedSocialCreditCode = `%${unifiedSocialCreditCode.trim()}%`;
    }

    // 使用OR连接查询条件
    queryBuilder.where(`(${whereConditions.join(' OR ')})`, parameters);

    // 添加排序
    queryBuilder.orderBy('customer.companyName', 'ASC');

    try {
      // 执行查询
      const customers = await queryBuilder.getMany();

      // 转换为响应格式
      return customers.map((customer) => ({
        companyName: customer.companyName || '',
        unifiedSocialCreditCode: customer.unifiedSocialCreditCode || '',
        sealStorageNumber: customer.sealStorageNumber || '',
        onlineBankingArchiveNumber: customer.onlineBankingStorageNumber || '',
        paperArchiveNumber: customer.paperArchiveNumber || '',
        archiveStorageRemarks: customer.archiveStorageRemarks || '',
      }));
    } catch (error) {
      this.logger.error(`查询客户档案信息失败: ${error.message}`, error.stack);
      throw new BadRequestException('查询客户档案信息失败');
    }
  }
}
