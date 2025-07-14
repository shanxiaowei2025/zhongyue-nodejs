import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { TaxVerification } from './entities/tax-verification.entity';
import { CreateTaxVerificationDto } from './dto/create-tax-verification.dto';
import { QueryTaxVerificationDto } from './dto/query-tax-verification.dto';

// 导入Customer实体
import { Customer } from '../../customer/entities/customer.entity';

@Injectable()
export class TaxVerificationService {
  constructor(
    @InjectRepository(TaxVerification)
    private taxVerificationRepository: Repository<TaxVerification>,
    
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  // 创建税务核查记录
  async create(createDto: CreateTaxVerificationDto, username: string) {
    console.log('收到的attachments数据:', JSON.stringify(createDto.attachments));
    
    // 不对attachments字段做任何处理，保持原样传递
    
    const taxVerification = this.taxVerificationRepository.create(createDto);
    const savedRecord = await this.taxVerificationRepository.save(taxVerification);
    
    // 添加调试信息
    console.log('保存后的attachments数据:', JSON.stringify(savedRecord.attachments));
    
    return savedRecord;
  }

  // 查询税务核查记录列表
  async findAll(queryDto: QueryTaxVerificationDto, user: any) {
    const { page = 1, pageSize = 10, ...filters } = queryDto;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<TaxVerification> = {};
    
    // 处理基础筛选条件
    if (filters.companyName) {
      where.companyName = Like(`%${filters.companyName}%`);
    }
    
    if (filters.unifiedSocialCreditCode) {
      where.unifiedSocialCreditCode = Like(`%${filters.unifiedSocialCreditCode}%`);
    }
    
    if (filters.taxBureau) {
      where.taxBureau = Like(`%${filters.taxBureau}%`);
    }
    
    if (filters.responsibleAccountant) {
      where.responsibleAccountant = Like(`%${filters.responsibleAccountant}%`);
    }
    
    // 处理日期范围条件
    if (filters.riskIssuedDateStart && filters.riskIssuedDateEnd) {
      where.riskIssuedDate = Between(
        new Date(filters.riskIssuedDateStart), 
        new Date(filters.riskIssuedDateEnd)
      );
    } else if (filters.riskIssuedDateStart) {
      where.riskIssuedDate = MoreThanOrEqual(new Date(filters.riskIssuedDateStart));
    } else if (filters.riskIssuedDateEnd) {
      where.riskIssuedDate = LessThanOrEqual(new Date(filters.riskIssuedDateEnd));
    }

    // 检查用户角色 - 可能存储在不同属性中
    const userRoles = user.roles || [user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
    const isAccountant = userRoles.includes('bookkeepingAccountant') || userRoles.includes('consultantAccountant');

    // 权限控制 - 管理员和超级管理员可以查看所有记录
    if (isAdmin) {
      // 管理员无需额外条件，可查看所有数据
    } 
    // 记账会计和顾问会计只能查看自己负责的企业
    else if (isAccountant) {
      // 查询该用户负责的企业列表
      const userCustomers = await this.customerRepository.find({
        where: [
          { bookkeepingAccountant: user.username },
          { consultantAccountant: user.username }
        ],
        select: ['unifiedSocialCreditCode']
      });
      
      // 获取统一社会信用代码列表
      const creditCodes = userCustomers.map(c => c.unifiedSocialCreditCode).filter(Boolean);
      
      if (creditCodes.length === 0) {
        // 如果没有关联企业，直接返回空结果
        return {
          list: [],
          total: 0,
          page,
          pageSize
        };
      }
      
      // 添加信用代码条件
      where.unifiedSocialCreditCode = In(creditCodes);
    } else {
      // 其他角色无权限查看
      throw new ForbiddenException('您没有权限访问税务核查记录');
    }

    // 执行查询
    const [records, total] = await this.taxVerificationRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: {
        id: 'DESC',
      },
    });

    return {
      list: records,
      total,
      page,
      pageSize
    };
  }

  // 根据ID查询单条税务核查记录
  async findOne(id: number, user: any) {
    const record = await this.taxVerificationRepository.findOne({ where: { id } });
    
    if (!record) {
      throw new NotFoundException(`税务核查记录 #${id} 不存在`);
    }

    // 检查用户角色 - 可能存储在不同属性中
    const userRoles = user.roles || [user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
    const isAccountant = userRoles.includes('bookkeepingAccountant') || userRoles.includes('consultantAccountant');

    // 权限控制
    if (isAdmin) {
      // 管理员可以查看所有记录
      return record;
    } 
    // 记账会计和顾问会计只能查看自己负责的企业
    else if (isAccountant) {
      // 查询该记录对应的企业是否由当前用户负责
      if (!record.unifiedSocialCreditCode) {
        throw new ForbiddenException('您没有权限查看此记录');
      }
      
      const customer = await this.customerRepository.findOne({
        where: [
          { 
            unifiedSocialCreditCode: record.unifiedSocialCreditCode,
            bookkeepingAccountant: user.username 
          },
          { 
            unifiedSocialCreditCode: record.unifiedSocialCreditCode,
            consultantAccountant: user.username 
          }
        ]
      });
      
      if (!customer) {
        throw new ForbiddenException('您没有权限查看此记录');
      }
      
      return record;
    } else {
      // 其他角色无权限查看
      throw new ForbiddenException('您没有权限查看此记录');
    }
  }
}
 