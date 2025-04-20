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
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CustomerPermissionService } from './services/customer-permission.service';
import { User } from '../users/entities/user.entity';
import { Department } from '../department/entities/department.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private customerPermissionService: CustomerPermissionService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  // 创建客户
  async create(createCustomerDto: CreateCustomerDto, userId: number) {
    console.log(`用户 ${userId} 尝试创建客户`);

    // 检查权限
    const hasPermission =
      await this.customerPermissionService.hasCustomerEditPermission(userId);
    console.log(`用户 ${userId} 创建权限检查结果: ${hasPermission}`);

    if (!hasPermission) {
      console.log(`用户 ${userId} 无权创建客户，抛出异常`);
      throw new ForbiddenException('没有创建客户的权限');
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department'],
    });

    if (!user) {
      throw new ForbiddenException('用户不存在');
    }

    // 创建客户实体
    const customer = this.customerRepository.create(createCustomerDto);

    // 获取用户的角色信息
    const userRoles = user.roles || [];

    // 无论什么角色，submitter字段都设置为当前用户名
    customer.submitter = user.username;

    // 根据用户角色设置其他相应字段
    if (userRoles.includes('consultantAccountant')) {
      customer.consultantAccountant = user.username;
    }

    if (userRoles.includes('bookkeepingAccountant')) {
      customer.bookkeepingAccountant = user.username;
    }

    if (userRoles.includes('invoiceOfficerName')) {
      customer.invoiceOfficerName = user.username;
    }

    if (userRoles.includes('branch_manager') && user.dept_id) {
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
      });

      if (department) {
        customer.location = department.name;
      }
    }

    // 保存客户信息
    return await this.customerRepository.save(customer);
  }

  // 查询客户列表
  async findAll(query: QueryCustomerDto, userId: number) {
    const {
      keyword,
      taxNumber,
      consultantAccountant,
      bookkeepingAccountant,
      taxBureau,
      enterpriseType,
      industryCategory,
      enterpriseStatus,
      businessStatus,
      location,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
    } = query;

    // 创建查询构建器
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // 添加基础查询条件
    if (keyword) {
      queryBuilder.andWhere('customer.companyName LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (taxNumber) {
      queryBuilder.andWhere('customer.taxNumber LIKE :taxNumber', {
        taxNumber: `%${taxNumber}%`,
      });
    }

    if (consultantAccountant) {
      queryBuilder.andWhere(
        'customer.consultantAccountant LIKE :consultantAccountant',
        {
          consultantAccountant: `%${consultantAccountant}%`,
        },
      );
    }

    if (bookkeepingAccountant) {
      queryBuilder.andWhere(
        'customer.bookkeepingAccountant LIKE :bookkeepingAccountant',
        {
          bookkeepingAccountant: `%${bookkeepingAccountant}%`,
        },
      );
    }

    if (taxBureau) {
      queryBuilder.andWhere('customer.taxBureau LIKE :taxBureau', {
        taxBureau: `%${taxBureau}%`,
      });
    }

    if (enterpriseType) {
      queryBuilder.andWhere('customer.enterpriseType LIKE :enterpriseType', {
        enterpriseType: `%${enterpriseType}%`,
      });
    }

    if (industryCategory) {
      queryBuilder.andWhere(
        'customer.industryCategory LIKE :industryCategory',
        {
          industryCategory: `%${industryCategory}%`,
        },
      );
    }

    if (enterpriseStatus) {
      queryBuilder.andWhere('customer.enterpriseStatus = :enterpriseStatus', {
        enterpriseStatus,
      });
    }

    if (businessStatus) {
      queryBuilder.andWhere('customer.businessStatus = :businessStatus', {
        businessStatus,
      });
    }

    if (location) {
      queryBuilder.andWhere('customer.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'customer.createTime BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
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
        const orConditions = permissionConditions.map((condition, index) => {
          const params = {};
          const conditions = [];

          Object.entries(condition).forEach(([key, value]) => {
            const paramKey = `${key}${index}`;
            params[paramKey] = value;
            conditions.push(`customer.${key} = :${paramKey}`);
          });

          queryBuilder.setParameters(params);
          return conditions.join(' AND ');
        });

        if (orConditions.length > 0) {
          queryBuilder.andWhere(`(${orConditions.join(' OR ')})`);
        }
      }
    } else if (Object.keys(permissionConditions).length > 0) {
      // 如果不是数组且不是空对象，添加权限条件
      Object.entries(permissionConditions).forEach(([key, value]) => {
        queryBuilder.andWhere(`customer.${key} = :${key}`, { [key]: value });
      });
    }

    console.log('最终SQL:', queryBuilder.getSql());

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
    // 先检查用户是否有权限查看任何客户
    const permissionConditions =
      await this.customerPermissionService.buildCustomerQueryFilter(userId);

    console.log('查询单个客户的权限条件:', permissionConditions);

    // 创建查询构建器
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // 添加 ID 条件
    queryBuilder.where('customer.id = :id', { id });

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
        const orConditions = permissionConditions.map((condition, index) => {
          const params = {};
          const conditions = [];

          Object.entries(condition).forEach(([key, value]) => {
            const paramKey = `${key}${index}`;
            params[paramKey] = value;
            conditions.push(`customer.${key} = :${paramKey}`);
          });

          return conditions.join(' AND ');
        });

        if (orConditions.length > 0) {
          queryBuilder.andWhere(`(${orConditions.join(' OR ')})`);
        }
      }
    } else if (Object.keys(permissionConditions).length > 0) {
      // 如果不是数组且不是空对象，添加权限条件
      Object.entries(permissionConditions).forEach(([key, value]) => {
        queryBuilder.andWhere(`customer.${key} = :${key}`, { [key]: value });
      });
    }

    console.log('最终SQL:', queryBuilder.getSql());

    // 执行查询
    const customer = await queryBuilder.getOne();
    if (!customer) {
      throw new NotFoundException(`客户ID ${id} 不存在或您无权查看`);
    }
    return customer;
  }

  // 更新客户
  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    userId: number,
  ) {
    // 检查权限
    const hasPermission =
      await this.customerPermissionService.hasCustomerEditPermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有更新客户的权限');
    }

    // 先查找客户，检查是否存在
    await this.findOne(id, userId);

    // 更新客户信息
    await this.customerRepository.update(id, updateCustomerDto);

    // 返回更新后的客户信息
    return this.findOne(id, userId);
  }

  // 删除客户
  async remove(id: number, userId: number) {
    // 检查权限
    const hasPermission =
      await this.customerPermissionService.hasCustomerEditPermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有删除客户的权限');
    }

    // 查找客户，检查是否存在
    const customer = await this.findOne(id, userId);

    // 删除客户
    return await this.customerRepository.remove(customer);
  }
}
