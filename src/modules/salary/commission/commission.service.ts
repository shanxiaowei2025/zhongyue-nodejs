import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import {
  BusinessSalesCommission,
  BusinessConsultantCommission,
  BusinessOtherCommission,
  PerformanceCommission,
} from './entities';
import {
  CreateBusinessSalesCommissionDto,
  CreateBusinessConsultantCommissionDto,
  CreateBusinessOtherCommissionDto,
  CreatePerformanceCommissionDto,
  QueryBusinessSalesCommissionDto,
  QueryBusinessCommissionDto,
  QueryPerformanceCommissionDto,
  UpdateBusinessSalesCommissionDto,
  UpdateBusinessCommissionDto,
  UpdatePerformanceCommissionDto
} from './dto';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(BusinessSalesCommission)
    private salesRepository: Repository<BusinessSalesCommission>,
    @InjectRepository(BusinessConsultantCommission)
    private consultantRepository: Repository<BusinessConsultantCommission>,
    @InjectRepository(BusinessOtherCommission)
    private otherRepository: Repository<BusinessOtherCommission>,
    @InjectRepository(PerformanceCommission)
    private performanceRepository: Repository<PerformanceCommission>,
  ) {}

  // 业务提成表销售接口实现
  async createBusinessSalesCommission(dto: CreateBusinessSalesCommissionDto): Promise<BusinessSalesCommission> {
    const record = this.salesRepository.create(dto);
    return this.salesRepository.save(record);
  }

  async findAllBusinessSalesCommission(query: QueryBusinessSalesCommissionDto) {
    const { page = 1, pageSize = 10, type, feeRange, minCommissionBase } = query;
    
    // 构建查询条件
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }
    
    if (minCommissionBase !== undefined) {
      const minBase = Number(minCommissionBase);
      if (!isNaN(minBase)) {
        where.minCommissionBase = Between(minBase - 0.01, minBase + 0.01);
      }
    }
    
    // 查询记录
    const [data, total] = await this.salesRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' }
    });
    
    return {
      data,
      total,
      page,
      pageSize
    };
  }

  async findOneBusinessSalesCommission(id: number): Promise<BusinessSalesCommission> {
    return this.salesRepository.findOneByOrFail({ id });
  }

  async updateBusinessSalesCommission(id: number, dto: UpdateBusinessSalesCommissionDto): Promise<BusinessSalesCommission> {
    await this.salesRepository.update(id, dto);
    return this.findOneBusinessSalesCommission(id);
  }

  async removeBusinessSalesCommission(id: number): Promise<void> {
    await this.salesRepository.delete(id);
  }

  // 业务提成表顾问接口实现
  async createBusinessConsultantCommission(dto: CreateBusinessConsultantCommissionDto): Promise<BusinessConsultantCommission> {
    const record = this.consultantRepository.create(dto);
    return this.consultantRepository.save(record);
  }

  async findAllBusinessConsultantCommission(query: QueryBusinessCommissionDto) {
    const { page = 1, pageSize = 10, feeRange, minCommissionBase } = query;
    
    // 构建查询条件
    const where: any = {};
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }
    
    if (minCommissionBase !== undefined) {
      const minBase = Number(minCommissionBase);
      if (!isNaN(minBase)) {
        where.minCommissionBase = Between(minBase - 0.01, minBase + 0.01);
      }
    }
    
    // 查询记录
    const [data, total] = await this.consultantRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' }
    });
    
    return {
      data,
      total,
      page,
      pageSize
    };
  }

  async findOneBusinessConsultantCommission(id: number): Promise<BusinessConsultantCommission> {
    return this.consultantRepository.findOneByOrFail({ id });
  }

  async updateBusinessConsultantCommission(id: number, dto: UpdateBusinessCommissionDto): Promise<BusinessConsultantCommission> {
    await this.consultantRepository.update(id, dto);
    return this.findOneBusinessConsultantCommission(id);
  }

  async removeBusinessConsultantCommission(id: number): Promise<void> {
    await this.consultantRepository.delete(id);
  }

  // 业务提成表其他接口实现
  async createBusinessOtherCommission(dto: CreateBusinessOtherCommissionDto): Promise<BusinessOtherCommission> {
    const record = this.otherRepository.create(dto);
    return this.otherRepository.save(record);
  }

  async findAllBusinessOtherCommission(query: QueryBusinessCommissionDto) {
    const { page = 1, pageSize = 10, feeRange, minCommissionBase } = query;
    
    // 构建查询条件
    const where: any = {};
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }
    
    if (minCommissionBase !== undefined) {
      const minBase = Number(minCommissionBase);
      if (!isNaN(minBase)) {
        where.minCommissionBase = Between(minBase - 0.01, minBase + 0.01);
      }
    }
    
    // 查询记录
    const [data, total] = await this.otherRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' }
    });
    
    return {
      data,
      total,
      page,
      pageSize
    };
  }

  async findOneBusinessOtherCommission(id: number): Promise<BusinessOtherCommission> {
    return this.otherRepository.findOneByOrFail({ id });
  }

  async updateBusinessOtherCommission(id: number, dto: UpdateBusinessCommissionDto): Promise<BusinessOtherCommission> {
    await this.otherRepository.update(id, dto);
    return this.findOneBusinessOtherCommission(id);
  }

  async removeBusinessOtherCommission(id: number): Promise<void> {
    await this.otherRepository.delete(id);
  }

  // 业务方法 - 根据金额查询匹配的提成比例
  async getCommissionRateByAmount(amount: number, type: 'sales' | 'consultant' | 'other', filterOptions?: any) {
    // 确定查询仓库
    let repository: Repository<any>;
    let additionalWhere = {};
    
    switch (type) {
      case 'sales':
        repository = this.salesRepository;
        if (filterOptions?.type) {
          additionalWhere = { type: filterOptions.type };
        }
        break;
      case 'consultant':
        repository = this.consultantRepository;
        break;
      case 'other':
        repository = this.otherRepository;
        break;
      default:
        throw new Error('无效的提成类型');
    }
    
    // 查询所有区间
    const records = await repository.find({ where: additionalWhere });
    
    // 常规处理：遍历找到匹配的区间
    for (const record of records) {
      const range = record.feeRange;
      const rangeArr = range.split('-');
      
      if (rangeArr.length === 2) {
        const min = parseInt(rangeArr[0], 10);
        const max = parseInt(rangeArr[1], 10);
        
        if (amount >= min && amount <= max) {
          return {
            matched: true,
            record,
          };
        }
      }
    }
    
    return {
      matched: false,
      record: null,
    };
  }

  // 绩效提成表接口实现
  async createPerformanceCommission(dto: CreatePerformanceCommissionDto): Promise<PerformanceCommission> {
    const record = this.performanceRepository.create(dto);
    return this.performanceRepository.save(record);
  }

  async findAllPerformanceCommission(query: QueryPerformanceCommissionDto) {
    const { page = 1, pageSize = 10, commissionType, position } = query;
    
    // 构建查询条件
    const where: any = {};
    
    if (commissionType) {
      where.commissionType = commissionType;
    }
    
    if (position) {
      where.position = Like(`%${position}%`);
    }
    
    // 查询记录
    const [data, total] = await this.performanceRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' }
    });
    
    return {
      data,
      total,
      page,
      pageSize
    };
  }

  async findOnePerformanceCommission(id: number): Promise<PerformanceCommission> {
    return this.performanceRepository.findOneByOrFail({ id });
  }

  async updatePerformanceCommission(id: number, dto: UpdatePerformanceCommissionDto): Promise<PerformanceCommission> {
    await this.performanceRepository.update(id, dto);
    return this.findOnePerformanceCommission(id);
  }

  async removePerformanceCommission(id: number): Promise<void> {
    await this.performanceRepository.delete(id);
  }
} 