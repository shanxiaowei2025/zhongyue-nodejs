import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  // 创建合同
  async create(createContractDto: CreateContractDto, username: string): Promise<Contract> {
    const contract = this.contractRepository.create({
      ...createContractDto,
      submitter: username
    });
    return await this.contractRepository.save(contract);
  }

  // 查询合同列表
  async findAll(query: QueryContractDto, permissionFilter: any) {
    const {
      keyword,
      business_type,
      customer_name,
      status,
      start_date,
      end_date,
      page = 1,
      pageSize = 10,
    } = query;

    const queryBuilder = this.contractRepository.createQueryBuilder('contract');

    // 添加权限过滤条件
    if (Array.isArray(permissionFilter)) {
      if (permissionFilter.length === 0) {
        // 如果没有任何权限，返回空结果
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      } else if (permissionFilter.length === 1 && Object.keys(permissionFilter[0]).length === 0) {
        // 如果是空对象 {}, 表示可以查看所有，不需要添加过滤条件
        // 这是处理 contract_data_view_all 权限的情况
      } else {
        // 处理权限过滤条件，可能有多个条件
        let hasFilter = false;
        const whereConditions = [];
        
        for (const filter of permissionFilter) {
          // 处理特殊的客户名称列表过滤条件
          if (filter._special === 'customerNames' && Array.isArray(filter.customerNames) && filter.customerNames.length > 0) {
            whereConditions.push(`contract.customer_name IN (:...customerNames)`);
            queryBuilder.setParameter('customerNames', filter.customerNames);
            hasFilter = true;
          } 
          // 处理常规过滤条件
          else if (!filter._special) {
            const conditions = [];
            for (const key of Object.keys(filter)) {
              conditions.push(`contract.${key} = :${key}`);
              queryBuilder.setParameter(key, filter[key]);
            }
            if (conditions.length > 0) {
              whereConditions.push(`(${conditions.join(' AND ')})`);
              hasFilter = true;
            }
          }
        }
        
        // 如果有有效的过滤条件，添加到查询中
        if (hasFilter && whereConditions.length > 0) {
          queryBuilder.andWhere(`(${whereConditions.join(' OR ')})`);
        } else if (permissionFilter.length > 0) {
          // 有权限过滤条件但没有生成有效的SQL条件，返回空结果
          // 这种情况可能是因为没有匹配的客户
          return {
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
      }
    }

    // 添加查询条件
    if (keyword) {
      queryBuilder.andWhere('(contract.contract_no LIKE :keyword OR contract.customer_name LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (business_type) {
      queryBuilder.andWhere('contract.business_type = :business_type', {
        business_type,
      });
    }

    if (customer_name) {
      queryBuilder.andWhere('contract.customer_name LIKE :customer_name', {
        customer_name: `%${customer_name}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('contract.status = :status', { status });
    }

    if (start_date) {
      queryBuilder.andWhere('contract.sign_date >= :start_date', { start_date });
    }

    if (end_date) {
      queryBuilder.andWhere('contract.sign_date <= :end_date', { end_date });
    }

    // 分页
    queryBuilder
      .orderBy('contract.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 根据ID查询合同
  async findOne(id: number): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException(`合同ID ${id} 不存在`);
    }
    return contract;
  }

  // 更新合同
  async update(id: number, updateContractDto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id);
    Object.assign(contract, updateContractDto);
    return await this.contractRepository.save(contract);
  }

  // 删除合同
  async remove(id: number): Promise<void> {
    const contract = await this.findOne(id);
    await this.contractRepository.remove(contract);
  }
} 