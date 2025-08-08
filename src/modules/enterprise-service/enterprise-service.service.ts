import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Like } from 'typeorm';

@Injectable()
export class EnterpriseServiceService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * 获取单个客户的详细信息
   * @param id 客户ID
   * @returns 客户详细信息
   */
  async getCustomerInfo(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`ID为${id}的客户不存在`);
    }

    return customer;
  }

  /**
   * 获取所有客户的列表
   * @param query 查询参数
   * @returns 客户列表和总数
   */
  async getAllCustomers(
    query: any = {},
  ): Promise<{ data: Customer[]; total: number }> {
    const { page = 1, pageSize = 10, ...filters } = query;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const whereConditions: any = {};

    // 遍历所有筛选条件，统一处理模糊查询
    const stringFieldsForLikeQuery = [
      'companyName',
      'unifiedSocialCreditCode',
      'consultantAccountant',
      'bookkeepingAccountant',
      'invoiceOfficer',
      'enterpriseType',
      'location',
      'taxBureau',
      'legalRepresentativeName',
      'enterpriseStatus',
      'customerLevel',
    ];

    // 将所有字符串字段的筛选条件都转为模糊查询
    for (const field of stringFieldsForLikeQuery) {
      if (filters[field]) {
        whereConditions[field] = Like(`%${filters[field]}%`);
      }
    }

    // 获取总数
    const total = await this.customerRepository.count({
      where:
        Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
    });

    // 获取分页数据
    const data = await this.customerRepository.find({
      where:
        Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      skip,
      take: pageSize,
      order: {
        contributionAmount: 'DESC',
      },
    });

    return { data, total };
  }
}
