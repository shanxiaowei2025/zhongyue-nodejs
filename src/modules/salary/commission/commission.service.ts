import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';

import { 
  AgencyCommission, 
  BusinessSalesCommission, 
  BusinessConsultantCommission, 
  BusinessOtherCommission,
  PerformanceCommission
} from './entities';

import {
  CreateAgencyCommissionDto,
  CreateBusinessSalesCommissionDto,
  CreateBusinessConsultantCommissionDto,
  CreateBusinessOtherCommissionDto,
  CreatePerformanceCommissionDto,
  QueryAgencyCommissionDto,
  QueryBusinessSalesCommissionDto,
  QueryBusinessCommissionDto,
  QueryPerformanceCommissionDto,
  UpdateAgencyCommissionDto,
  UpdateBusinessSalesCommissionDto,
  UpdateBusinessCommissionDto,
  UpdatePerformanceCommissionDto
} from './dto';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(AgencyCommission)
    private agencyRepository: Repository<AgencyCommission>,
    @InjectRepository(BusinessSalesCommission)
    private salesRepository: Repository<BusinessSalesCommission>,
    @InjectRepository(BusinessConsultantCommission)
    private consultantRepository: Repository<BusinessConsultantCommission>,
    @InjectRepository(BusinessOtherCommission)
    private otherRepository: Repository<BusinessOtherCommission>,
    @InjectRepository(PerformanceCommission)
    private performanceRepository: Repository<PerformanceCommission>,
  ) {}

  // 代理费提成表 CRUD 操作
  async createAgencyCommission(dto: CreateAgencyCommissionDto): Promise<AgencyCommission> {
    const newRecord = this.agencyRepository.create(dto);
    return this.agencyRepository.save(newRecord);
  }

  async findAllAgencyCommission(query: QueryAgencyCommissionDto) {
    const { agencyCount, minCommissionBase, feeRange, commissionRate } = query;
    const where: any = {};
    
    if (agencyCount) {
      where.agencyCount = Like(`%${agencyCount}%`);
    }
    
    if (minCommissionBase) {
      where.minCommissionBase = Like(`%${minCommissionBase}%`);
    }
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }
    
    if (commissionRate) {
      where.commissionRate = Like(`%${commissionRate}%`);
    }
    
    const [data, total] = await this.agencyRepository.findAndCount({
      where,
      order: { id: 'ASC' },
    });
    
    return { data, total };
  }

  async findOneAgencyCommission(id: number): Promise<AgencyCommission> {
    return this.agencyRepository.findOne({ where: { id } });
  }

  async updateAgencyCommission(id: number, dto: UpdateAgencyCommissionDto): Promise<AgencyCommission> {
    await this.agencyRepository.update(id, dto);
    return this.findOneAgencyCommission(id);
  }

  async removeAgencyCommission(id: number): Promise<void> {
    await this.agencyRepository.delete(id);
  }

  // 业务提成表销售 CRUD 操作
  async createBusinessSalesCommission(dto: CreateBusinessSalesCommissionDto): Promise<BusinessSalesCommission> {
    const newRecord = this.salesRepository.create(dto);
    return this.salesRepository.save(newRecord);
  }

  async findAllBusinessSalesCommission(query: QueryBusinessSalesCommissionDto) {
    const { type, feeRange, baseSalary, commissionRate } = query;
    const where: any = {};
    
    if (type) {
      where.type = Like(`%${type}%`);
    }
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }

    if (baseSalary) {
      where.baseSalary = Like(`%${baseSalary}%`);
    }

    if (commissionRate) {
      where.commissionRate = Like(`%${commissionRate}%`);
    }
    
    const [data, total] = await this.salesRepository.findAndCount({
      where,
      order: { id: 'ASC' },
    });
    
    return { data, total };
  }

  async findOneBusinessSalesCommission(id: number): Promise<BusinessSalesCommission> {
    return this.salesRepository.findOne({ where: { id } });
  }

  async updateBusinessSalesCommission(id: number, dto: UpdateBusinessSalesCommissionDto): Promise<BusinessSalesCommission> {
    await this.salesRepository.update(id, dto);
    return this.findOneBusinessSalesCommission(id);
  }

  async removeBusinessSalesCommission(id: number): Promise<void> {
    await this.salesRepository.delete(id);
  }

  // 业务提成表顾问 CRUD 操作
  async createBusinessConsultantCommission(dto: CreateBusinessConsultantCommissionDto): Promise<BusinessConsultantCommission> {
    const newRecord = this.consultantRepository.create(dto);
    return this.consultantRepository.save(newRecord);
  }

  async findAllBusinessConsultantCommission(query: QueryBusinessCommissionDto) {
    const { feeRange, commissionRate } = query;
    const where: any = {};
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }
    
    if (commissionRate) {
      where.commissionRate = Like(`%${commissionRate}%`);
    }
    
    const [data, total] = await this.consultantRepository.findAndCount({
      where,
      order: { id: 'ASC' },
    });
    
    return { data, total };
  }

  async findOneBusinessConsultantCommission(id: number): Promise<BusinessConsultantCommission> {
    return this.consultantRepository.findOne({ where: { id } });
  }

  async updateBusinessConsultantCommission(id: number, dto: UpdateBusinessCommissionDto): Promise<BusinessConsultantCommission> {
    await this.consultantRepository.update(id, dto);
    return this.findOneBusinessConsultantCommission(id);
  }

  async removeBusinessConsultantCommission(id: number): Promise<void> {
    await this.consultantRepository.delete(id);
  }

  // 业务提成表其他 CRUD 操作
  async createBusinessOtherCommission(dto: CreateBusinessOtherCommissionDto): Promise<BusinessOtherCommission> {
    const newRecord = this.otherRepository.create(dto);
    return this.otherRepository.save(newRecord);
  }

  async findAllBusinessOtherCommission(query: QueryBusinessCommissionDto) {
    const { feeRange, commissionRate } = query;
    const where: any = {};
    
    if (feeRange) {
      where.feeRange = Like(`%${feeRange}%`);
    }
    
    if (commissionRate) {
      where.commissionRate = Like(`%${commissionRate}%`);
    }
    
    const [data, total] = await this.otherRepository.findAndCount({
      where,
      order: { id: 'ASC' },
    });
    
    return { data, total };
  }

  async findOneBusinessOtherCommission(id: number): Promise<BusinessOtherCommission> {
    return this.otherRepository.findOne({ where: { id } });
  }

  async updateBusinessOtherCommission(id: number, dto: UpdateBusinessCommissionDto): Promise<BusinessOtherCommission> {
    await this.otherRepository.update(id, dto);
    return this.findOneBusinessOtherCommission(id);
  }

  async removeBusinessOtherCommission(id: number): Promise<void> {
    await this.otherRepository.delete(id);
  }

  // 业务方法 - 根据金额查询匹配的提成比例
  async getCommissionRateByAmount(amount: number, type: 'agency' | 'sales' | 'consultant' | 'other', filterOptions?: any) {
    // 确定查询仓库
    let repository: Repository<any>;
    let additionalWhere = {};
    
    switch (type) {
      case 'agency':
        repository = this.agencyRepository;
        // 如果传入的是整数类型的代理户数，需要查找其所在的区间
        if (filterOptions?.agencyCount && typeof filterOptions.agencyCount === 'number') {
          const agencyCount = filterOptions.agencyCount;
          // 不需要设置additionalWhere，将在后面单独处理
        } else if (filterOptions?.agencyCount && typeof filterOptions.agencyCount === 'string') {
          additionalWhere = { agencyCount: filterOptions.agencyCount };
        }
        break;
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
    
    // 特殊处理：如果是代理费提成表且输入的是整数代理户数
    if (type === 'agency' && filterOptions?.agencyCount && typeof filterOptions.agencyCount === 'number') {
      const agencyCountNum = filterOptions.agencyCount;
      
      // 筛选匹配的代理户数区间
      const matchedRecords = records.filter(record => {
        const range = record.agencyCount;
        const rangeArr = range.split('-');
        
        if (rangeArr.length === 2) {
          const min = parseInt(rangeArr[0], 10);
          const max = parseInt(rangeArr[1], 10);
          
          return agencyCountNum >= min && agencyCountNum <= max;
        }
        
        return false;
      });
      
      // 在筛选后的记录中继续查找匹配金额范围的记录
      for (const record of matchedRecords) {
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
      
      // 如果找到了匹配代理户数但没有匹配金额的记录，返回未匹配
      return {
        matched: false,
        record: null,
      };
    }
    
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

  // 绩效提成表 CRUD 操作
  async createPerformanceCommission(dto: CreatePerformanceCommissionDto): Promise<PerformanceCommission> {
    const newRecord = this.performanceRepository.create(dto);
    return this.performanceRepository.save(newRecord);
  }

  async findAllPerformanceCommission(query: QueryPerformanceCommissionDto) {
    const { pLevel, gradeLevel, householdCount, baseSalary, performance } = query;
    const where: any = {};
    
    if (pLevel) {
      where.pLevel = Like(`%${pLevel}%`);
    }
    
    if (gradeLevel) {
      where.gradeLevel = Like(`%${gradeLevel}%`);
    }
    
    if (householdCount) {
      where.householdCount = Like(`%${householdCount}%`);
    }
    
    if (baseSalary !== undefined) {
      where.baseSalary = baseSalary;
    }
    
    if (performance !== undefined) {
      where.performance = performance;
    }
    
    const [data, total] = await this.performanceRepository.findAndCount({
      where,
      order: { id: 'ASC' },
    });
    
    return { data, total };
  }

  async findOnePerformanceCommission(id: number): Promise<PerformanceCommission> {
    return this.performanceRepository.findOne({ where: { id } });
  }

  async updatePerformanceCommission(id: number, dto: UpdatePerformanceCommissionDto): Promise<PerformanceCommission> {
    await this.performanceRepository.update(id, dto);
    return this.findOnePerformanceCommission(id);
  }

  async removePerformanceCommission(id: number): Promise<void> {
    await this.performanceRepository.delete(id);
  }
} 