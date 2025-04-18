// 服务文件包含业务逻辑的具体实现
// 主要功能：
// 1. 实现数据库操作（增删改查）
// 2. 处理业务逻辑
// 3. 数据转换和处理
// 4. 错误处理
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
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
    const hasPermission = await this.customerPermissionService.hasCustomerEditPermission(userId);
    console.log(`用户 ${userId} 创建权限检查结果: ${hasPermission}`);
    
    if (!hasPermission) {
      console.log(`用户 ${userId} 无权创建客户，抛出异常`);
      throw new ForbiddenException('没有创建客户的权限');
    }
    
    // 获取用户信息
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['department']
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
        where: { id: user.dept_id }
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
      pageSize = 10 
    } = query;

    // 基础查询条件
    const where: any = {};

    // 如果有关键词，搜索公司名称
    if (keyword) {
      where.companyName = Like(`%${keyword}%`);
    }

    // 添加其他查询条件...
    if (taxNumber) where.taxNumber = Like(`%${taxNumber}%`);
    if (consultantAccountant) where.consultantAccountant = Like(`%${consultantAccountant}%`);
    if (bookkeepingAccountant) where.bookkeepingAccountant = Like(`%${bookkeepingAccountant}%`);
    if (taxBureau) where.taxBureau = Like(`%${taxBureau}%`);
    if (enterpriseType) where.enterpriseType = Like(`%${enterpriseType}%`);
    if (industryCategory) where.industryCategory = Like(`%${industryCategory}%`);
    if (enterpriseStatus) where.enterpriseStatus = enterpriseStatus;
    if (businessStatus) where.businessStatus = businessStatus;
    if (location) where.location = Like(`%${location}%`);
    if (startDate && endDate) where.createTime = Between(startDate, endDate);

    // 获取权限过滤条件
    const permissionFilter = await this.customerPermissionService.buildCustomerQueryFilter(userId);
    
    // 合并权限过滤条件
    const finalWhere = { ...where, ...permissionFilter };

    // 执行查询
    const [items, total] = await this.customerRepository.findAndCount({
      where: finalWhere,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        createTime: 'DESC',
      },
    });

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
    const permissionFilter = await this.customerPermissionService.buildCustomerQueryFilter(userId);
    
    // 构建查询条件，合并ID和权限过滤条件
    const where = { id, ...permissionFilter };
    
    const customer = await this.customerRepository.findOne({ where });
    if (!customer) {
      throw new NotFoundException(`客户ID ${id} 不存在或您无权查看`);
    }
    return customer;
  }

  // 更新客户
  async update(id: number, updateCustomerDto: UpdateCustomerDto, userId: number) {
    // 检查权限
    const hasPermission = await this.customerPermissionService.hasCustomerEditPermission(userId);
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
    const hasPermission = await this.customerPermissionService.hasCustomerEditPermission(userId);
    if (!hasPermission) {
      throw new ForbiddenException('没有删除客户的权限');
    }
    
    // 查找客户，检查是否存在
    const customer = await this.findOne(id, userId);
    
    // 删除客户
    return await this.customerRepository.remove(customer);
  }
}