import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { FinancialSelfInspection } from './entities/financial-self-inspection.entity';
import { CreateFinancialSelfInspectionDto } from './dto/create-financial-self-inspection.dto';
import { CreateFinancialSelfInspectionRestrictedDto } from './dto/create-financial-self-inspection-restricted.dto';
import { UpdateFinancialSelfInspectionDto } from './dto/update-financial-self-inspection.dto';
import { QueryFinancialSelfInspectionDto } from './dto/query-financial-self-inspection.dto';
import { RectificationCompletionDto } from './dto/rectification-completion.dto';
import { ApprovalDto } from './dto/approval.dto';
import { ReviewerApprovalDto } from './dto/reviewer-approval.dto';
import { RejectDto } from './dto/reject.dto';
import { ReviewerRejectDto } from './dto/reviewer-reject.dto';
import { EmployeeService } from '../../employee/employee.service';
import { safeConvertToDate } from '../../../common/utils';

@Injectable()
export class FinancialSelfInspectionService {
  private readonly logger = new Logger(FinancialSelfInspectionService.name);

  constructor(
    @InjectRepository(FinancialSelfInspection)
    private financialSelfInspectionRepository: Repository<FinancialSelfInspection>,
    private employeeService: EmployeeService,
  ) {}

  /**
   * 创建账务自查记录
   */
  async create(createDto: CreateFinancialSelfInspectionDto | CreateFinancialSelfInspectionRestrictedDto, currentUsername?: string): Promise<FinancialSelfInspection> {
    // 1. 获取当前用户的rank字段(分析职级: Px-y格式)
    if (currentUsername) {
      const currentEmployee = await this.employeeService.findByName(currentUsername);
      if (!currentEmployee || !currentEmployee.rank) {
        throw new BadRequestException('无法获取当前用户职级信息');
      }

      const currentRank = this.parseRank(currentEmployee.rank);
      
      // 2. 如果提供了统一社会信用代码，获取对应的记账会计
      if (createDto.unifiedSocialCreditCode) {
        // 从customer表查询记账会计信息
        const customerRepository = this.financialSelfInspectionRepository.manager.getRepository('sys_customer');
        const customer = await customerRepository.findOne({
          where: { unifiedSocialCreditCode: createDto.unifiedSocialCreditCode }
        });

        if (customer && customer.bookkeepingAccountant) {
          // 如果传入的记账会计与客户表中的不一致，以客户表为准
          if (!createDto.bookkeepingAccountant || createDto.bookkeepingAccountant !== customer.bookkeepingAccountant) {
            createDto.bookkeepingAccountant = customer.bookkeepingAccountant;
          }
          
          // 3. 获取记账会计的职级
          const accountantEmployee = await this.employeeService.findByName(customer.bookkeepingAccountant);
          
          if (accountantEmployee && accountantEmployee.rank) {
            const accountantRank = this.parseRank(accountantEmployee.rank);
            
            // 4. 对比职级
            // 如果记账会计是当前用户自己，允许创建
            if (customer.bookkeepingAccountant === currentUsername) {
              // 允许自查
              this.logger.log(`用户 ${currentUsername} 正在对自己负责的客户进行账务自查，允许操作`);
            } 
            // 如果当前用户职级较高，允许创建
            else if (currentRank.mainRank > accountantRank.mainRank) {
              this.logger.log(`用户 ${currentUsername}(职级:P${currentRank.mainRank}) 可以抽查 ${customer.bookkeepingAccountant}(职级:P${accountantRank.mainRank}) 的记录，职级更高`);
            }
            // 如果双方都是P4，允许创建
            else if (currentRank.mainRank === 4 && accountantRank.mainRank === 4) {
              this.logger.log(`用户 ${currentUsername} 和记账会计 ${customer.bookkeepingAccountant} 都是P4职级，允许互查`);
            }
            // 其他情况，不允许创建
            else {
              throw new ForbiddenException(`不能抽查比自己等级高或同级的记账会计：您的职级P${currentRank.mainRank}，记账会计${customer.bookkeepingAccountant}的职级P${accountantRank.mainRank}`);
            }
          } else {
            this.logger.warn(`记账会计 ${customer.bookkeepingAccountant} 没有职级信息`);
          }
        } else {
          this.logger.warn(`未找到统一社会信用代码 ${createDto.unifiedSocialCreditCode} 对应的客户记录或记账会计信息`);
        }
      }
    }

    const record = this.financialSelfInspectionRepository.create(createDto);
    
    // 记录最终使用的记账会计信息
    if (currentUsername && createDto.bookkeepingAccountant) {
      this.logger.log(`创建账务自查记录 - 抽查人: ${currentUsername}, 记账会计: ${createDto.bookkeepingAccountant}, 企业: ${createDto.companyName || ''}, 统一社会信用代码: ${createDto.unifiedSocialCreditCode || ''}`);
    }
    
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新账务自查记录
   * 注意：此方法仅供内部使用，不再通过API直接暴露
   */
  async update(id: number, updateDto: UpdateFinancialSelfInspectionDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 更新记录
    const updatedRecord = this.financialSelfInspectionRepository.merge(record, updateDto);
    return this.financialSelfInspectionRepository.save(updatedRecord);
  }

  /**
   * 更新整改记录
   */
  async updateRectificationCompletion(id: number, dto: RectificationCompletionDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 确保DTO中的数据包含所需字段
    const validRecords = dto.rectificationRecords.filter(item => item && item.date && item.result);
    
    if (validRecords.length === 0) {
      throw new BadRequestException('整改记录必须包含日期和结果');
    }

    // 初始化整改记录数组（如果不存在）
    if (!record.rectificationRecords) {
      record.rectificationRecords = [];
    }

    // 添加新的整改记录，确保每条记录都包含所需属性
    record.rectificationRecords = [
      ...record.rectificationRecords,
      ...validRecords.map(item => ({
        date: item.date,
        result: item.result
      }))
    ];
    
    this.logger.debug(`添加整改记录: ${JSON.stringify(validRecords)}`);
    
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新审核通过记录
   */
  async updateApproval(id: number, dto: ApprovalDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 确保DTO中的数据包含所需字段
    const validRecords = dto.approvalRecords.filter(item => item && item.date && item.remark);
    
    if (validRecords.length === 0) {
      throw new BadRequestException('审核通过记录必须包含日期和备注');
    }

    // 初始化审核通过记录数组（如果不存在）
    if (!record.approvalRecords) {
      record.approvalRecords = [];
    }

    // 添加新的审核通过记录，确保每条记录都包含所需属性
    record.approvalRecords = [
      ...record.approvalRecords,
      ...validRecords.map(item => ({
        date: item.date,
        remark: item.remark
      }))
    ];
    
    this.logger.debug(`添加审核通过记录: ${JSON.stringify(validRecords)}`);
    
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新审核退回记录
   */
  async updateReject(id: number, dto: RejectDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 确保DTO中的数据包含所需字段
    const validRecords = dto.rejectRecords.filter(item => item && item.date && item.reason);
    
    if (validRecords.length === 0) {
      throw new BadRequestException('审核退回记录必须包含日期和退回原因');
    }

    // 初始化退回记录数组（如果为空）
    if (!record.rejectRecords) {
      record.rejectRecords = [];
    }

    // 添加新的退回记录，确保每条记录都包含所需属性
    record.rejectRecords = [
      ...record.rejectRecords,
      ...validRecords.map(item => ({
        date: item.date,
        reason: item.reason
      }))
    ];
    
    this.logger.debug(`添加审核退回记录: ${JSON.stringify(validRecords)}`);

    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新复查审核退回记录
   */
  async updateReviewerReject(id: number, dto: ReviewerRejectDto, username?: string): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 确保DTO中的数据包含所需字段
    const validRecords = dto.reviewerRejectRecords.filter(item => item && item.date && item.reason);
    
    if (validRecords.length === 0) {
      throw new BadRequestException('复查审核退回记录必须包含日期和退回原因');
    }

    // 初始化复查退回记录数组（如果为空）
    if (!record.reviewerRejectRecords) {
      record.reviewerRejectRecords = [];
    }

    // 添加新的复查退回记录，确保每条记录都包含所需属性
    record.reviewerRejectRecords = [
      ...record.reviewerRejectRecords,
      ...validRecords.map(item => ({
        date: item.date,
        reason: item.reason
      }))
    ];
    
    this.logger.debug(`添加复查审核退回记录: ${JSON.stringify(validRecords)}`);
    
    // 设置当前用户为复查人（如果传入用户名且复查人为空）
    if (username && !record.reviewer) {
      record.reviewer = username;
      this.logger.debug(`设置复查人为: ${username}`);
    }

    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 删除账务自查记录
   */
  async remove(id: number): Promise<void> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    await this.financialSelfInspectionRepository.remove(record);
  }

  /**
   * 根据ID查找单个记录
   */
  async findOne(id: number): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    return record;
  }

  /**
   * 根据ID查找我提交的单个记录（带权限检查）
   */
  async findMySubmittedOne(id: number, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    
    // 权限检查：非管理员只能查看自己提交的记录
    if (!isAdmin && record.inspector !== username) {
      throw new NotFoundException(`未找到ID为${id}的记录或您没有权限查看此记录`);
    }
    
    return record;
  }

  /**
   * 根据ID查找我负责的单个记录（带权限检查）
   */
  async findMyResponsibleOne(id: number, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    
    // 权限检查：非管理员只能查看自己负责的记录
    if (!isAdmin && record.bookkeepingAccountant !== username && record.consultantAccountant !== username) {
      throw new NotFoundException(`未找到ID为${id}的记录或您没有权限查看此记录`);
    }
    
    return record;
  }

  /**
   * 查询我提交的记录（抽查人是当前用户）
   * 如果用户是管理员或超级管理员，则查看所有记录
   */
  async findMySubmitted(username: string, queryDto: QueryFinancialSelfInspectionDto, isAdmin: boolean = false) {
    const { 
      companyName, 
      unifiedSocialCreditCode, 
      bookkeepingAccountant, 
      consultantAccountant,
      inspector,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1, 
      pageSize = 10 
    } = queryDto;

    // 构建查询
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;
    
    // 如果不是管理员，则添加固定条件：抽查人是当前用户
    if (!isAdmin) {
      queryBuilder.where('record.inspector = :username', { username });
      hasWhereCondition = true;
    }
    
    // 添加可选过滤条件，确保每个字段的过滤条件只作用于该字段
    if (inspector && isAdmin) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
        hasWhereCondition = true;
      }
    }

    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
        hasWhereCondition = true;
      }
    }

    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
        hasWhereCondition = true;
      }
    }

    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
        hasWhereCondition = true;
      }
    }

    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
        hasWhereCondition = true;
      }
    }

    // 日期范围查询
    if (inspectionDateStart && inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateStart) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate >= :start', { start: inspectionDateStart });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', { start: inspectionDateStart });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', { end: inspectionDateEnd });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', { end: inspectionDateEnd });
        hasWhereCondition = true;
      }
    }

    // 添加分页
    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 执行查询
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 查询我负责的记录（记账会计或顾问会计是当前用户）
   * 如果用户是管理员或超级管理员，则查看所有记录
   */
  async findMyResponsible(username: string, queryDto: QueryFinancialSelfInspectionDto, isAdmin: boolean = false) {
    const { 
      companyName, 
      unifiedSocialCreditCode, 
      inspector,
      bookkeepingAccountant,
      consultantAccountant,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1, 
      pageSize = 10 
    } = queryDto;

    // 构建查询
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;
    
    // 如果不是管理员，则添加固定条件：记账会计或顾问会计是当前用户
    if (!isAdmin) {
      queryBuilder.where('(record.bookkeepingAccountant = :username OR record.consultantAccountant = :username)', { username });
      hasWhereCondition = true;
    }
    
    // 添加可选过滤条件，确保每个字段的过滤条件只作用于该字段
    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
        hasWhereCondition = true;
      }
    }
    
    // 其他字段的过滤条件
    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
        hasWhereCondition = true;
      }
    }
    
    if (inspector) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
        hasWhereCondition = true;
      }
    }
    
    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
        hasWhereCondition = true;
      }
    }
    
    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
        hasWhereCondition = true;
      }
    }

    // 日期范围查询
    if (inspectionDateStart && inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateStart) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate >= :start', { start: inspectionDateStart });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', { start: inspectionDateStart });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', { end: inspectionDateEnd });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', { end: inspectionDateEnd });
        hasWhereCondition = true;
      }
    }

    // 添加分页
    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 执行查询
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 更新复查审核通过记录
   */
  async updateReviewerApproval(id: number, dto: ReviewerApprovalDto, username?: string): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 确保DTO中的数据包含所需字段
    const validRecords = dto.reviewerApprovalRecords.filter(item => item && item.date && item.remark);
    
    if (validRecords.length === 0) {
      throw new BadRequestException('复查审核通过记录必须包含日期和备注');
    }

    // 初始化复查审核通过记录数组（如果为空）
    if (!record.reviewerApprovalRecords) {
      record.reviewerApprovalRecords = [];
    }

    // 添加新的复查审核通过记录，确保每条记录都包含所需属性
    record.reviewerApprovalRecords = [
      ...record.reviewerApprovalRecords,
      ...validRecords.map(item => ({
        date: item.date,
        remark: item.remark
      }))
    ];
    
    this.logger.debug(`添加复查审核通过记录: ${JSON.stringify(validRecords)}`);

    // 设置当前用户为复查人（如果传入用户名且复查人为空）
    if (username && !record.reviewer) {
      record.reviewer = username;
      this.logger.debug(`设置复查人为: ${username}`);
    }

    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 根据ID查找我复查的单个记录（带权限检查）
   */
  async findMyReviewedOne(id: number, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    
    // 取消下级检查的权限限制，任何用户都可以查看记录
    // 管理员权限保留，但不再需要特殊处理，因为所有用户都可以查看所有记录
    
    return record;
  }

  /**
   * 解析职级字符串，返回主要等级和次要等级
   * @param rank 职级字符串，格式为 "Px-y"，其中 x 和 y 都是数字
   */
  private parseRank(rank: string): { mainRank: number; subRank: number } {
    if (!rank || typeof rank !== 'string') {
      return { mainRank: 0, subRank: 0 };
    }

    try {
      const parts = rank.split('-');
      if (parts.length !== 2) {
        return { mainRank: 0, subRank: 0 };
      }

      // 提取 P 后面的数字
      const mainRankStr = parts[0].replace(/\D/g, '');
      const mainRank = parseInt(mainRankStr, 10) || 0;
      
      // 提取 - 后面的数字
      const subRank = parseInt(parts[1], 10) || 0;

      return { mainRank, subRank };
    } catch (error) {
      this.logger.error(`解析职级失败: ${rank}`, error.stack);
      return { mainRank: 0, subRank: 0 };
    }
  }

  /**
   * 比较两个职级，判断是否 rank1 低于 rank2
   * @param rank1 职级1
   * @param rank2 职级2
   * @returns 如果 rank1 低于 rank2，则返回 true
   */
  private isLowerRank(rank1: string, rank2: string): boolean {
    const parsed1 = this.parseRank(rank1);
    const parsed2 = this.parseRank(rank2);

    // 首先比较主等级
    if (parsed1.mainRank < parsed2.mainRank) {
      return true;
    }

    // 如果主等级相同，比较次等级
    if (parsed1.mainRank === parsed2.mainRank && parsed1.subRank < parsed2.subRank) {
      return true;
    }

    return false;
  }

  /**
   * 获取当前用户的所有下级员工名称
   * @param username 当前用户名
   */
  private async getSubordinates(username: string): Promise<string[]> {
    try {
      // 获取当前用户信息
      const currentEmployee = await this.employeeService.findByName(username);
      
      if (!currentEmployee || !currentEmployee.rank) {
        this.logger.warn(`未找到用户 ${username} 或用户没有职级信息`);
        return [];
      }

      // 获取所有员工
      const allEmployees = await this.employeeService.findAllNoLimit();
      
      // 筛选出职级低于当前用户的员工
      const subordinates = allEmployees.filter(employee => 
        employee.name && employee.rank && 
        this.isLowerRank(employee.rank, currentEmployee.rank)
      );

      const subordinateNames = subordinates.map(emp => emp.name);
      this.logger.log(`用户 ${username}(职级:${currentEmployee.rank}) 的下级员工: ${subordinateNames.join(', ')}`);
      
      return subordinateNames;
    } catch (error) {
      this.logger.error(`获取下级员工失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 查询我复查的记录
   */
  async findMyReviewed(username: string, queryDto: QueryFinancialSelfInspectionDto, isAdmin: boolean = false) {
    const { 
      companyName, 
      unifiedSocialCreditCode, 
      bookkeepingAccountant, 
      consultantAccountant,
      inspector,
      reviewer,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1, 
      pageSize = 10 
    } = queryDto;

    // 构建查询
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;
    
    // 取消下级检查的权限限制，任何用户都可以查看所有记录
    // 管理员权限保留，但不再需要特殊处理，因为所有用户都可以查看所有记录
    
    // 添加可选过滤条件
    if (reviewer) {
      queryBuilder.where('record.reviewer LIKE :reviewer', { reviewer: `%${reviewer}%` });
      hasWhereCondition = true;
    }
    
    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
        hasWhereCondition = true;
      }
    }

    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
        hasWhereCondition = true;
      }
    }

    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :bookkeeper', { bookkeeper: `%${bookkeepingAccountant}%` });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :bookkeeper', { bookkeeper: `%${bookkeepingAccountant}%` });
        hasWhereCondition = true;
      }
    }

    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
        hasWhereCondition = true;
      }
    }

    if (inspector) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
        hasWhereCondition = true;
      }
    }

    // 如果提供了抽查日期范围，添加日期过滤条件
    if (inspectionDateStart && inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateStart) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate >= :start', { start: inspectionDateStart });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', { start: inspectionDateStart });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', { end: inspectionDateEnd });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', { end: inspectionDateEnd });
        hasWhereCondition = true;
      }
    }

    // 添加分页
    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 执行查询
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 统计每个用户作为抽查人的记录数量
   * @param startDate 抽查人确认开始日期
   * @param endDate 抽查人确认结束日期
   * @returns 每个用户的记录数量
   */
  async countAsInspector(startDate?: string, endDate?: string): Promise<{ items: { name: string; count: number }[]; total: number }> {
    // 构建查询条件
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 筛选有抽查人确认日期的记录，且抽查人不为空
    queryBuilder.where('record.inspectorConfirmation IS NOT NULL AND record.inspector IS NOT NULL');
    
    // 添加日期范围条件
    if (startDate && endDate) {
      // 创建日期对象
      const start = new Date(startDate);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      queryBuilder.andWhere('record.inspectorConfirmation BETWEEN :start AND :end', {
        start,
        end
      });
      
      this.logger.debug(`抽查人统计日期范围: ${start.toISOString()} - ${end.toISOString()}`);
    } else if (startDate) {
      queryBuilder.andWhere('record.inspectorConfirmation >= :start', {
        start: new Date(startDate)
      });
    } else if (endDate) {
      // 如果只有结束日期，也设置为当天的23:59:59.999
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('record.inspectorConfirmation <= :end', {
        end
      });
    }
    
    // 按抽查人分组并计算每个人的记录数
    queryBuilder.select('record.inspector', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.inspector')
      .orderBy('count', 'DESC');
    
    // 获取结果
    const results = await queryBuilder.getRawMany();
    
    // 计算总记录数
    const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    // 将结果转换为所需格式
    const items = results.map(item => ({
      name: item.name,
      count: parseInt(item.count)
    }));
    
    return { items, total };
  }

  /**
   * 统计每个用户作为复查人的记录数量
   * @param startDate 复查人确认开始日期
   * @param endDate 复查人确认结束日期
   * @returns 每个用户的记录数量
   */
  async countAsReviewer(startDate?: string, endDate?: string): Promise<{ items: { name: string; count: number }[]; total: number }> {
    // 构建查询条件
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 筛选有复查人确认日期的记录，且复查人不为空
    queryBuilder.where('record.reviewerConfirmation IS NOT NULL AND record.reviewer IS NOT NULL');
    
    // 添加日期范围条件
    if (startDate && endDate) {
      // 创建日期对象
      const start = new Date(startDate);
      // 对于结束日期，设置为当天的23:59:59.999，以包含整天
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      queryBuilder.andWhere('record.reviewerConfirmation BETWEEN :start AND :end', {
        start,
        end
      });
      
      this.logger.debug(`复查人统计日期范围: ${start.toISOString()} - ${end.toISOString()}`);
    } else if (startDate) {
      queryBuilder.andWhere('record.reviewerConfirmation >= :start', {
        start: new Date(startDate)
      });
    } else if (endDate) {
      // 如果只有结束日期，也设置为当天的23:59:59.999
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('record.reviewerConfirmation <= :end', {
        end
      });
    }
    
    // 按复查人分组并计算每个人的记录数
    queryBuilder.select('record.reviewer', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.reviewer')
      .orderBy('count', 'DESC');
    
    // 获取结果
    const results = await queryBuilder.getRawMany();
    
    // 计算总记录数
    const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    // 将结果转换为所需格式
    const items = results.map(item => ({
      name: item.name,
      count: parseInt(item.count)
    }));
    
    return { items, total };
  }
} 