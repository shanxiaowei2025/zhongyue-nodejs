// 服务文件包含业务逻辑的具体实现
// 主要功能：
// 1. 实现数据库操作（增删改查）
// 2. 处理业务逻辑
// 3. 数据转换和处理
// 4. 错误处理
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  // 创建客户
  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  // 查询客户列表
  async findAll(query: QueryCustomerDto) {
    const { 
      keyword, 
      socialCreditCode, 
      salesRepresentative, 
      taxBureau,
      taxRegistrationType,
      enterpriseStatus,
      businessStatus,
      startDate,
      endDate,
      page = 1,
      pageSize = 10 
    } = query;

    const where: any = {};

    // 如果有关键词，搜索公司名称
    if (keyword) {
      where.companyName = Like(`%${keyword}%`);
    }

    // 如果有关键词，搜索社会信用代码
    if (socialCreditCode) {
      where.socialCreditCode = Like(`%${socialCreditCode}%`);
    }

    // 如果有关键词，搜索业务员
    if (salesRepresentative) {
      where.salesRepresentative = Like(`%${salesRepresentative}%`);
    }

    // 如果有关键词，搜索税务分局
    if (taxBureau) {
      where.taxBureau = Like(`%${taxBureau}%`);
    }

    // 如果有关键词，搜索税务登记类型
    if (taxRegistrationType) {
      where.taxRegistrationType = taxRegistrationType;
    }

    // 如果有关键词，搜索企业状态
    if (enterpriseStatus) {
      where.enterpriseStatus = enterpriseStatus;
    }

    // 如果有关键词，搜索业务状态
    if (businessStatus) {
      where.businessStatus = businessStatus;
    }

    // 如果有关键词，搜索创建时间范围
    if (startDate && endDate) {
      where.createTime = Between(startDate, endDate);
    }

    // 执行查询
    const [items, total] = await this.customerRepository.findAndCount({
      where,
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
  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`客户ID ${id} 不存在`);
    }
    return customer;
  }

  // 更新客户
  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  // 删除客户
  async remove(id: number) {
    const customer = await this.findOne(id);
    return await this.customerRepository.remove(customer);
  }
} 